'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { exigirFinanceiroAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { cpfValido, soDigitos } from '@/lib/formatos'
import { MOTIVOS_SEM_RECIBO } from '@/lib/receita-saude'
import type { EstadoForm } from '@/components/form'

export async function salvarDadosRecibo(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const cpf = soDigitos(String(dados.get('cpf') ?? ''))
  const registro = String(dados.get('registro') ?? '').trim().slice(0, 15)
  if (!cpfValido(cpf)) return { erro: 'CPF inválido. Use o mesmo CPF com que a Érika entra no Carnê-Leão.' }
  await db.$transaction([
    db.configuracao.upsert({ where: { chave: 'cpfProfissional' }, create: { chave: 'cpfProfissional', valor: cpf }, update: { valor: cpf } }),
    db.configuracao.upsert({ where: { chave: 'registroProfissional' }, create: { chave: 'registroProfissional', valor: registro }, update: { valor: registro } }),
  ])
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Configuracao', resumo: 'Alterou os dados para o Receita Saúde (CPF/registro da profissional)' })
  revalidatePath('/sistema/financeiro/receita-saude')
  return { ok: 'Dados salvos.' }
}

/** Depois de importar o arquivo no e-CAC: marca exatamente esses pagamentos como "recibo emitido". */
export async function marcarLoteEmitido(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const ids = String(dados.get('ids') ?? '').split(',').filter(Boolean)
  if (ids.length === 0) return { erro: 'Nada para marcar.' }
  const { count } = await db.pagamento.updateMany({ where: { id: { in: ids }, estornadoEm: null }, data: { reciboEmitido: true } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Pagamento', resumo: `Marcou ${count} recibo(s) como emitidos no Receita Saúde (importação em lote)` })
  revalidatePath('/sistema', 'layout')
  return { ok: `${count} recibo(s) marcados como emitidos.` }
}

/** "Não será emitido recibo": tira o pagamento das pendências, com o motivo. */
export async function dispensarRecibo(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const escolhido = String(dados.get('motivo') ?? '')
  const detalhe = String(dados.get('detalhe') ?? '').trim()
  if (!(MOTIVOS_SEM_RECIBO as readonly string[]).includes(escolhido)) return { erro: 'Escolha o motivo.' }
  const outro = escolhido.startsWith('Outro')
  if (outro && !detalhe) return { erro: 'Em "Outro", descreva o motivo no campo de detalhe.' }
  const motivo = (outro ? `Outro: ${detalhe}` : escolhido).slice(0, 200)
  const p = await db.pagamento.update({ where: { id }, data: { reciboDispensadoMotivo: motivo }, include: { paciente: { select: { nome: true } } } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Pagamento', entidadeId: id, resumo: `Marcou "sem recibo" no pagamento de ${p.paciente.nome} (${motivo})` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Não será emitido recibo para este pagamento.' }
}

export async function desfazerDispensa(id: string, _e: EstadoForm, _d: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const p = await db.pagamento.update({ where: { id }, data: { reciboDispensadoMotivo: null }, include: { paciente: { select: { nome: true } } } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Pagamento', entidadeId: id, resumo: `Voltou a pedir recibo para o pagamento de ${p.paciente.nome}` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Voltou para a lista de recibos a emitir.' }
}
