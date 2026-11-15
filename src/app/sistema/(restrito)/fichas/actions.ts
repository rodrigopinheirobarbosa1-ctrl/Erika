'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { MODELO_ATUAL } from '@/lib/anamnese/modelo'
import type { EstadoForm } from '@/components/form'

const PRAZO_DIAS = 15

/**
 * Gera o link da ficha para um pedido de contato OU um paciente. Um link
 * pendente anterior para a mesma pessoa é cancelado (só vale o mais novo).
 */
export async function gerarFicha(alvo: { preCadastroId?: string; pacienteId?: string }, _e: EstadoForm, _d: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  let nome: string
  if (alvo.preCadastroId) {
    const p = await db.preCadastro.findUnique({ where: { id: alvo.preCadastroId }, select: { nome: true } })
    if (!p) return { erro: 'Pedido não encontrado.' }
    nome = p.nome
  } else if (alvo.pacienteId) {
    const p = await db.paciente.findUnique({ where: { id: alvo.pacienteId }, select: { nome: true, nomeSocial: true } })
    if (!p) return { erro: 'Paciente não encontrado.' }
    nome = p.nomeSocial || p.nome
  } else return { erro: 'Destino inválido.' }

  const filtro = alvo.preCadastroId ? { preCadastroId: alvo.preCadastroId } : { pacienteId: alvo.pacienteId }
  await db.$transaction([
    db.fichaAnamnese.updateMany({ where: { ...filtro, status: 'PENDENTE' }, data: { status: 'CANCELADA' } }),
    db.fichaAnamnese.create({
      data: {
        ...filtro,
        token: randomBytes(32).toString('base64url'),
        modeloVersao: MODELO_ATUAL.versao,
        nomeDestinatario: nome,
        expiraEm: new Date(Date.now() + PRAZO_DIAS * 86400000),
        enviadaPorNome: usuario.nome,
      },
    }),
  ])
  await auditar({ usuario, acao: 'CRIAR', entidade: 'FichaAnamnese', entidadeId: alvo.preCadastroId ?? alvo.pacienteId, resumo: `Gerou link da ficha de anamnese para ${nome}` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Link gerado. Agora toque em "Enviar pelo WhatsApp".' }
}

export async function cancelarFicha(id: string, _e: EstadoForm, _d: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const f = await db.fichaAnamnese.findUnique({ where: { id } })
  if (!f || f.status !== 'PENDENTE') return { erro: 'Este link não está mais pendente.' }
  await db.fichaAnamnese.update({ where: { id }, data: { status: 'CANCELADA' } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'FichaAnamnese', entidadeId: id, resumo: `Cancelou o link da ficha de anamnese de ${f.nomeDestinatario}` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Link cancelado: ele não abre mais.' }
}
