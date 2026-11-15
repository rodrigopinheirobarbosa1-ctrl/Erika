'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction, exigirFinanceiroAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import type { EstadoForm } from '@/components/form'

/** Registra que a mensagem foi enviada (ou pulada). Chamado pelo botão do WhatsApp. */
export async function registrarEnvio(atendimentoId: string, modeloId: string, pulado = false): Promise<void> {
  const usuario = await exigirAcessoPacientesAction()
  const [a, m] = await Promise.all([
    db.atendimento.findUnique({ where: { id: atendimentoId }, select: { id: true } }),
    db.modeloMensagem.findUnique({ where: { id: modeloId }, select: { id: true } }),
  ])
  if (!a || !m) return
  await db.envioMensagem.upsert({
    where: { atendimentoId_modeloId: { atendimentoId, modeloId } },
    create: { atendimentoId, modeloId, pulado, enviadoPorNome: usuario.nome },
    update: { pulado, enviadoPorNome: usuario.nome, enviadoEm: new Date() },
  })
  revalidatePath('/sistema', 'layout')
}

const esquema = z.object({
  nome: z.string().trim().min(2, 'Dê um nome à mensagem.').max(80),
  texto: z.string().trim().min(5, 'Escreva o texto da mensagem.').max(1000),
  dias: z.coerce.number().int().min(0).max(30).default(0),
  horas: z.coerce.number().int().min(0).max(23).default(0),
  minutos: z.coerce.number().int().min(0).max(59).default(0),
})

// Configurar textos e lembretes: psicóloga e administrador do sistema.
export async function salvarModelo(id: string | null, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const atual = id ? await db.modeloMensagem.findUnique({ where: { id } }) : null
  if (id && !atual) return { erro: 'Mensagem não encontrada.' }
  const lembrete = !atual || atual.tipo === 'LEMBRETE'
  const antecedenciaMin = d.dias * 1440 + d.horas * 60 + d.minutos
  if (lembrete && antecedenciaMin < 5) return { erro: 'O lembrete precisa ser pelo menos 5 minutos antes da sessão.' }
  const ativo = dados.get('ativo') === 'on'

  const campos = { nome: d.nome, texto: d.texto, ativo: id ? ativo : true, ...(lembrete ? { antecedenciaMin } : {}) }
  if (atual) await db.modeloMensagem.update({ where: { id: atual.id }, data: campos })
  else await db.modeloMensagem.create({ data: { ...campos, tipo: 'LEMBRETE' } })
  await auditar({ usuario, acao: atual ? 'ALTERAR' : 'CRIAR', entidade: 'ModeloMensagem', entidadeId: id, resumo: `${atual ? 'Alterou' : 'Criou'} a mensagem "${d.nome}"` })
  revalidatePath('/sistema', 'layout')
  return { ok: atual ? 'Mensagem salva.' : 'Lembrete criado.' }
}

export async function excluirLembrete(id: string, _e: EstadoForm, _d: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const m = await db.modeloMensagem.findUnique({ where: { id } })
  if (!m || m.tipo !== 'LEMBRETE') return { erro: 'Só lembretes podem ser excluídos (a confirmação pode ser desligada).' }
  await db.modeloMensagem.delete({ where: { id } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'ModeloMensagem', entidadeId: id, resumo: `Excluiu o lembrete "${m.nome}"` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Lembrete excluído.' }
}
