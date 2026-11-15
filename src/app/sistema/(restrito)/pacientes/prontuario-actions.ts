'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirUsuarioAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { criptografar } from '@/lib/cripto'
import { escreveProntuario } from '@/lib/permissoes'
import type { EstadoForm } from '@/components/form'

const esquema = z.object({
  texto: z.string().trim().min(3, 'Escreva o registro.').max(20000, 'Texto muito longo (máximo 20.000 letras).'),
  tipo: z.enum(['EVOLUCAO', 'ANOTACAO']).default('ANOTACAO'),
  atendimentoId: z.string().optional(),
  retificaId: z.string().optional(),
})

/**
 * Novo registro no prontuário. Registros nunca são alterados nem apagados:
 * corrigir = novo registro do tipo RETIFICACAO apontando o original.
 */
export async function registrarNoProntuario(pacienteId: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioAction()
  if (!escreveProntuario(usuario.papel)) return { erro: 'Só a psicóloga registra no prontuário.' }
  const r = esquema.safeParse(Object.fromEntries([...dados.entries()].filter(([, v]) => v !== '')))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data

  const paciente = await db.paciente.findUnique({ where: { id: pacienteId }, select: { nome: true } })
  if (!paciente) return { erro: 'Paciente não encontrado.' }

  let atendimentoId: string | null = null
  if (d.atendimentoId) {
    const a = await db.atendimento.findFirst({ where: { id: d.atendimentoId, pacienteId } })
    if (!a) return { erro: 'Sessão não encontrada para este paciente.' }
    atendimentoId = a.id
    // Registrar a evolução de uma sessão agendada = ela aconteceu.
    if (a.status === 'AGENDADO') await db.atendimento.update({ where: { id: a.id }, data: { status: 'REALIZADO' } })
  }
  let retificaId: string | null = null
  if (d.retificaId) {
    const original = await db.registroProntuario.findFirst({ where: { id: d.retificaId, pacienteId } })
    if (!original) return { erro: 'Registro original não encontrado.' }
    retificaId = original.id
    atendimentoId = original.atendimentoId
  }

  const tipo = retificaId ? 'RETIFICACAO' : atendimentoId ? 'EVOLUCAO' : d.tipo
  await db.registroProntuario.create({
    data: { pacienteId, atendimentoId, retificaId, tipo, textoCripto: criptografar(d.texto)!, autorId: usuario.id, autorNome: usuario.nome },
  })
  await auditar({
    usuario,
    acao: 'CRIAR',
    entidade: 'Prontuario',
    entidadeId: pacienteId,
    resumo: `${tipo === 'RETIFICACAO' ? 'Retificou um registro' : tipo === 'EVOLUCAO' ? 'Registrou a evolução de uma sessão' : 'Fez uma anotação'} no prontuário de ${paciente.nome}`,
  })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Registrado no prontuário.' }
}
