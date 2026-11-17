'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { exigirFinanceiroAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { cpfValido, soDigitos } from '@/lib/formatos'
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
