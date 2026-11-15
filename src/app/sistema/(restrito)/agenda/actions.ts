'use server'

import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { localParaUtc, rotuloInstante, segundaDaSemana, sobrepoe, utcParaLocal } from '@/lib/horario'
import { STATUS_ATENDIMENTO } from '@/lib/rotulos'
import { lerReais } from '@/lib/formatos'
import { novaSalaJitsi } from '@/lib/video'
import type { EstadoForm } from '@/components/form'

/** Sessão online: o paciente precisa ter a sala fixa dele (cria na primeira vez). */
async function garantirSala(pacienteId: string) {
  await db.paciente.updateMany({ where: { id: pacienteId, salaVideo: null }, data: { salaVideo: novaSalaJitsi() } })
}

const vazioNulo = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const campos = z.object({
  data: z.string().min(1, 'Informe a data.'),
  hora: z.string().min(1, 'Informe o horário.'),
  duracaoMin: z.coerce.number().int().min(10, 'Duração mínima: 10 minutos.').max(240, 'Duração máxima: 4 horas.'),
  modalidade: z.preprocess(vazioNulo, z.enum(['PRESENCIAL', 'ONLINE', 'DOMICILIO']).nullable()),
  linkOnline: z.preprocess(vazioNulo, z.string().trim().url('Link da videochamada inválido (comece com https://).').max(500).nullable()),
  recado: z.preprocess(vazioNulo, z.string().trim().max(300).nullable()),
})

/** Sessões que ocupam a agenda (desmarcadas e faltas não bloqueiam horário). */
const OCUPAM: Prisma.AtendimentoWhereInput = { status: { in: ['AGENDADO', 'REALIZADO'] } }

async function conflitos(horarios: Date[], duracaoMin: number, exceto?: string) {
  if (horarios.length === 0) return []
  const min = new Date(Math.min(...horarios.map((h) => h.getTime())) - 4 * 3600000)
  const max = new Date(Math.max(...horarios.map((h) => h.getTime())) + 4 * 3600000)
  const existentes = await db.atendimento.findMany({
    where: { ...OCUPAM, inicio: { gte: min, lte: max }, ...(exceto ? { id: { not: exceto } } : {}) },
    include: { paciente: { select: { nome: true, nomeSocial: true } } },
  })
  return existentes.filter((e) => horarios.some((h) => sobrepoe(h, duracaoMin, e.inicio, e.duracaoMin)))
}

function textoConflitos(lista: Awaited<ReturnType<typeof conflitos>>): string {
  const itens = lista.slice(0, 3).map((c) => `${rotuloInstante(c.inicio)} (${c.paciente.nomeSocial || c.paciente.nome})`)
  return `Esse horário bate com: ${itens.join('; ')}${lista.length > 3 ? ` e mais ${lista.length - 3}` : ''}. Para agendar mesmo assim, marque "Agendar mesmo com conflito".`
}

export async function agendar(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const r = campos
    .extend({
      pacienteId: z.string().min(1, 'Escolha o paciente.'),
      repetirSemanas: z.coerce.number().int().min(0).max(52, 'Repetição máxima: 52 semanas.').default(0),
    })
    .safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data

  const paciente = await db.paciente.findUnique({ where: { id: d.pacienteId } })
  if (!paciente) return { erro: 'Paciente não encontrado.' }
  const primeiro = localParaUtc(d.data, d.hora)
  if (!primeiro) return { erro: 'Data ou horário inválido.' }

  const horarios = Array.from({ length: d.repetirSemanas + 1 }, (_, i) => new Date(primeiro.getTime() + i * 7 * 86400000))
  const choques = await conflitos(horarios, d.duracaoMin)
  if (choques.length > 0 && dados.get('ignorarConflito') !== 'on') return { erro: textoConflitos(choques) }

  const modalidade = d.modalidade ?? paciente.modalidade ?? 'PRESENCIAL'
  if (modalidade === 'ONLINE' && !d.linkOnline) await garantirSala(paciente.id)
  const serieId = horarios.length > 1 ? randomUUID() : null
  await db.atendimento.createMany({
    data: horarios.map((inicio) => ({
      pacienteId: paciente.id,
      inicio,
      duracaoMin: d.duracaoMin,
      modalidade,
      linkOnline: d.linkOnline,
      recado: d.recado,
      valorCentavos: paciente.valorSessaoCentavos,
      serieId,
    })),
  })
  await auditar({
    usuario,
    acao: 'CRIAR',
    entidade: 'Atendimento',
    entidadeId: paciente.id,
    resumo: `Agendou ${horarios.length > 1 ? `${horarios.length} sessões semanais` : 'sessão'} de ${paciente.nome} a partir de ${rotuloInstante(primeiro)}`,
  })
  revalidatePath('/sistema', 'layout')
  // Abre a primeira sessão criada, com a confirmação ao paciente em destaque.
  const criada = await db.atendimento.findFirst({ where: { pacienteId: paciente.id, inicio: primeiro }, orderBy: { criadoEm: 'desc' }, select: { id: true } })
  redirect(criada ? `/sistema/agenda/${criada.id}?novo=1` : `/sistema/agenda?semana=${segundaDaSemana(d.data)}`)
}

export async function alterarAtendimento(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const r = campos.extend({ status: z.enum(['AGENDADO', 'REALIZADO', 'FALTOU', 'DESMARCADO_PACIENTE', 'DESMARCADO_PSICOLOGA']) }).safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const atual = await db.atendimento.findUnique({ where: { id }, include: { paciente: { select: { nome: true } } } })
  if (!atual) return { erro: 'Sessão não encontrada.' }
  const inicio = localParaUtc(d.data, d.hora)
  if (!inicio) return { erro: 'Data ou horário inválido.' }

  // Valor desta sessão (vazio = sem valor; 0 = sem cobrança, ex.: cortesia).
  const valorTexto = String(dados.get('valor') ?? '').trim()
  const valorCentavos = valorTexto === '' ? null : lerReais(valorTexto)
  if (valorCentavos !== null && (Number.isNaN(valorCentavos) || valorCentavos < 0)) return { erro: 'Valor da sessão inválido. Ex.: 180,00' }
  const cobrarFalta = dados.get('cobrarFalta') === 'on'

  const mudouHorario = inicio.getTime() !== atual.inicio.getTime() || d.duracaoMin !== atual.duracaoMin
  if (mudouHorario && (d.status === 'AGENDADO' || d.status === 'REALIZADO')) {
    const choques = await conflitos([inicio], d.duracaoMin, id)
    if (choques.length > 0 && dados.get('ignorarConflito') !== 'on') return { erro: textoConflitos(choques) }
  }

  if ((d.modalidade ?? atual.modalidade) === 'ONLINE' && !d.linkOnline) await garantirSala(atual.pacienteId)
  await db.atendimento.update({
    where: { id },
    data: { inicio, duracaoMin: d.duracaoMin, modalidade: d.modalidade ?? atual.modalidade, linkOnline: d.linkOnline, recado: d.recado, status: d.status, valorCentavos, cobrarFalta },
  })
  const mudancas = [
    mudouHorario && `remarcou de ${rotuloInstante(atual.inicio)} para ${rotuloInstante(inicio)}`,
    d.status !== atual.status && `situação: ${STATUS_ATENDIMENTO[d.status]}`,
    valorCentavos !== atual.valorCentavos && 'valor',
    cobrarFalta !== atual.cobrarFalta && (cobrarFalta ? 'falta será cobrada' : 'falta não será cobrada'),
  ].filter(Boolean)
  await auditar({
    usuario,
    acao: 'ALTERAR',
    entidade: 'Atendimento',
    entidadeId: id,
    resumo: `Alterou a sessão de ${atual.paciente.nome}${mudancas.length ? ` (${mudancas.join('; ')})` : ''}`,
  })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Sessão atualizada.' }
}

/** Botões rápidos: Realizado / Faltou / Desmarcado... */
export async function mudarStatus(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const status = z.enum(['AGENDADO', 'REALIZADO', 'FALTOU', 'DESMARCADO_PACIENTE', 'DESMARCADO_PSICOLOGA']).safeParse(dados.get('status'))
  if (!status.success) return { erro: 'Situação inválida.' }
  const atual = await db.atendimento.findUnique({ where: { id }, include: { paciente: { select: { nome: true } } } })
  if (!atual) return { erro: 'Sessão não encontrada.' }

  // "Desmarcar também as próximas desta série" (fim do acompanhamento, férias...)
  const serie = dados.get('serie') === 'on' && atual.serieId
  const alvo: Prisma.AtendimentoWhereInput = serie
    ? { serieId: atual.serieId, inicio: { gte: atual.inicio }, status: 'AGENDADO' }
    : { id }
  const { count } = await db.atendimento.updateMany({ where: serie ? alvo : { id }, data: { status: status.data } })
  await auditar({
    usuario,
    acao: 'ALTERAR',
    entidade: 'Atendimento',
    entidadeId: id,
    resumo: `Marcou ${count > 1 ? `${count} sessões` : 'a sessão'} de ${atual.paciente.nome} (${rotuloInstante(atual.inicio)}) como ${STATUS_ATENDIMENTO[status.data]}`,
  })
  revalidatePath('/sistema', 'layout')
  return { ok: count > 1 ? `${count} sessões atualizadas.` : `Marcado como ${STATUS_ATENDIMENTO[status.data].toLowerCase()}.` }
}

/** Só para agendamento feito por engano: sessão ainda agendada e sem registro no prontuário. */
export async function excluirAgendamento(id: string, _e: EstadoForm, _dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const atual = await db.atendimento.findUnique({ where: { id }, include: { paciente: { select: { nome: true } }, _count: { select: { registros: true } } } })
  if (!atual) return { erro: 'Sessão não encontrada.' }
  if (atual.status !== 'AGENDADO' || atual._count.registros > 0) {
    return { erro: 'Só dá para excluir sessão ainda agendada e sem registro no prontuário. Use "Desmarcado" nos outros casos.' }
  }
  await db.atendimento.delete({ where: { id } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Atendimento', entidadeId: id, resumo: `Excluiu o agendamento de ${atual.paciente.nome} em ${rotuloInstante(atual.inicio)} (feito por engano)` })
  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/agenda?semana=${segundaDaSemana(utcParaLocal(atual.inicio).data)}`)
}

/** Botão "Criar sala" na ficha do paciente. */
export async function criarSalaPaciente(pacienteId: string, _e: EstadoForm, _d: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const p = await db.paciente.findUnique({ where: { id: pacienteId }, select: { nome: true, salaVideo: true } })
  if (!p) return { erro: 'Paciente não encontrado.' }
  if (p.salaVideo) return { ok: 'O paciente já tem sala.' }
  await garantirSala(pacienteId)
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Paciente', entidadeId: pacienteId, resumo: `Criou a sala de videochamada de ${p.nome}` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Sala criada.' }
}
