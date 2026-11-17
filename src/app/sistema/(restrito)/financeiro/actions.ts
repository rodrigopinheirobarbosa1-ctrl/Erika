'use server'

import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction, exigirFinanceiroAction } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { cpfValido, formatarData, formatarReais, lerData, lerReais, soDigitos } from '@/lib/formatos'
import { mesmoDiaMesesDepois } from '@/lib/financeiro'
import { CATEGORIAS_DESPESA } from '@/lib/rotulos'
import type { EstadoForm } from '@/components/form'

const FORMAS = ['PIX', 'DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'OUTRO'] as const
const CATEGORIAS = Object.keys(CATEGORIAS_DESPESA) as [keyof typeof CATEGORIAS_DESPESA, ...(keyof typeof CATEGORIAS_DESPESA)[]]
const vazioNulo = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

function lerValor(texto: unknown): number | string {
  const v = lerReais(String(texto ?? ''))
  if (v == null) return 'Informe o valor.'
  if (Number.isNaN(v) || v <= 0) return 'Valor inválido. Ex.: 180,00'
  return v
}

// ------------------------------------------------------------------ RECEBER

const pagamento = z.object({
  pacienteId: z.string().min(1, 'Escolha o paciente.'),
  data: z.string(),
  valor: z.string(),
  forma: z.enum(FORMAS),
  pagadorNome: z.preprocess(vazioNulo, z.string().trim().max(160).nullable()),
  pagadorCpf: z.preprocess(vazioNulo, z.string().trim().max(20).nullable()),
  observacao: z.preprocess(vazioNulo, z.string().trim().max(300).nullable()),
})

export async function registrarPagamento(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const r = pagamento.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const valor = lerValor(d.valor)
  if (typeof valor === 'string') return { erro: valor }
  const data = lerData(d.data)
  if (!data) return { erro: 'Data do pagamento inválida.' }
  if (d.pagadorCpf && !cpfValido(d.pagadorCpf)) return { erro: 'CPF de quem pagou inválido.' }
  const paciente = await db.paciente.findUnique({ where: { id: d.pacienteId }, select: { id: true, nome: true } })
  if (!paciente) return { erro: 'Paciente não encontrado.' }

  await db.pagamento.create({
    data: {
      pacienteId: paciente.id,
      data,
      valorCentavos: valor,
      forma: d.forma,
      pagadorNome: d.pagadorNome,
      pagadorCpf: d.pagadorCpf ? soDigitos(d.pagadorCpf) : null,
      observacao: d.observacao,
      reciboEmitido: dados.get('reciboEmitido') === 'on',
      autorNome: usuario.nome,
    },
  })
  await auditar({ usuario, acao: 'CRIAR', entidade: 'Pagamento', entidadeId: paciente.id, resumo: `Registrou pagamento de ${formatarReais(valor)} de ${paciente.nome} (${formatarData(data)})` })
  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/pacientes/${paciente.id}#financeiro`)
}

/** Pagamento lançado errado não é apagado: é estornado, com motivo. */
export async function estornarPagamento(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const motivo = String(dados.get('motivo') ?? '').trim()
  if (motivo.length < 3) return { erro: 'Informe o motivo do estorno.' }
  const p = await db.pagamento.findUnique({ where: { id }, include: { paciente: { select: { nome: true } } } })
  if (!p) return { erro: 'Pagamento não encontrado.' }
  if (p.estornadoEm) return { erro: 'Este pagamento já foi estornado.' }
  await db.pagamento.update({ where: { id }, data: { estornadoEm: new Date(), estornoMotivo: motivo.slice(0, 300) } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Pagamento', entidadeId: id, resumo: `Estornou pagamento de ${formatarReais(p.valorCentavos)} de ${p.paciente.nome} (motivo: ${motivo.slice(0, 120)})` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Pagamento estornado.' }
}

/** Marca/desmarca "recibo emitido no Receita Saúde". */
export async function marcarRecibo(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const emitido = dados.get('emitido') === 'sim'
  const p = await db.pagamento.update({ where: { id }, data: { reciboEmitido: emitido, ...(emitido ? { reciboDispensadoMotivo: null } : {}) }, include: { paciente: { select: { nome: true } } } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Pagamento', entidadeId: id, resumo: `Marcou recibo ${emitido ? 'emitido' : 'pendente'}: ${formatarReais(p.valorCentavos)} de ${p.paciente.nome}` })
  revalidatePath('/sistema', 'layout')
  return { ok: emitido ? 'Recibo marcado como emitido.' : 'Recibo marcado como pendente.' }
}

// ------------------------------------------------------------------ PAGAR

const despesa = z.object({
  descricao: z.string().trim().min(2, 'Descreva a despesa.').max(160),
  categoria: z.enum(CATEGORIAS),
  valor: z.string(),
  vencimento: z.string(),
  observacao: z.preprocess(vazioNulo, z.string().trim().max(300).nullable()),
})

export async function criarDespesa(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const r = despesa.extend({ repetirMeses: z.coerce.number().int().min(0).max(23).default(0) }).safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const valor = lerValor(d.valor)
  if (typeof valor === 'string') return { erro: valor }
  if (!lerData(d.vencimento)) return { erro: 'Data de vencimento inválida.' }
  const pagaJa = dados.get('jaPaga') === 'on'

  const serieId = d.repetirMeses > 0 ? randomUUID() : null
  const vencimentos = Array.from({ length: d.repetirMeses + 1 }, (_, i) => lerData(mesmoDiaMesesDepois(d.vencimento, i))!)
  await db.despesa.createMany({
    data: vencimentos.map((vencimento, i) => ({
      descricao: d.descricao,
      categoria: d.categoria,
      valorCentavos: valor,
      vencimento,
      observacao: d.observacao,
      serieId,
      ...(pagaJa && i === 0 ? { pagoEm: vencimento } : {}),
    })),
  })
  await auditar({ usuario, acao: 'CRIAR', entidade: 'Despesa', resumo: `Lançou despesa "${d.descricao}" de ${formatarReais(valor)}${vencimentos.length > 1 ? ` (${vencimentos.length} meses)` : ''}` })
  revalidatePath('/sistema', 'layout')
  return { ok: vencimentos.length > 1 ? `${vencimentos.length} despesas lançadas (uma por mês).` : 'Despesa lançada.' }
}

export async function alterarDespesa(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const r = despesa.extend({ pagoEm: z.string().optional(), forma: z.preprocess(vazioNulo, z.enum(FORMAS).nullable()) }).safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const valor = lerValor(d.valor)
  if (typeof valor === 'string') return { erro: valor }
  const vencimento = lerData(d.vencimento)
  if (!vencimento) return { erro: 'Data de vencimento inválida.' }
  const pagoEm = lerData(d.pagoEm)
  if (pagoEm === undefined) return { erro: 'Data de pagamento inválida.' }
  await db.despesa.update({ where: { id }, data: { descricao: d.descricao, categoria: d.categoria, valorCentavos: valor, vencimento, pagoEm, forma: pagoEm ? d.forma : null, observacao: d.observacao } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Despesa', entidadeId: id, resumo: `Alterou a despesa "${d.descricao}"` })
  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/financeiro/despesas?mes=${d.vencimento.slice(0, 7)}`)
}

/** Botão rápido "Paga hoje" / "Desfazer". */
export async function pagarDespesa(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const desfazer = dados.get('desfazer') === 'sim'
  const hoje = lerData(new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10))!
  const forma = z.enum(FORMAS).safeParse(dados.get('forma'))
  const dd = await db.despesa.update({ where: { id }, data: desfazer ? { pagoEm: null, forma: null } : { pagoEm: hoje, forma: forma.success ? forma.data : null } })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Despesa', entidadeId: id, resumo: `${desfazer ? 'Desfez o pagamento' : 'Marcou como paga'}: "${dd.descricao}" (${formatarReais(dd.valorCentavos)})` })
  revalidatePath('/sistema', 'layout')
  return { ok: desfazer ? 'Voltou para "em aberto".' : 'Marcada como paga hoje.' }
}

/** Despesa ainda em aberto pode ser excluída (lançada por engano ou cancelada). */
export async function excluirDespesa(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirFinanceiroAction()
  const dd = await db.despesa.findUnique({ where: { id } })
  if (!dd) return { erro: 'Despesa não encontrada.' }
  if (dd.pagoEm) return { erro: 'Despesa já paga não pode ser excluída. Desfaça o pagamento antes, se foi engano.' }
  const proximas = dados.get('proximas') === 'on' && dd.serieId
  const { count } = await db.despesa.deleteMany({
    where: proximas ? { serieId: dd.serieId, vencimento: { gte: dd.vencimento }, pagoEm: null } : { id },
  })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'Despesa', entidadeId: id, resumo: `Excluiu ${count > 1 ? `${count} despesas` : 'a despesa'} "${dd.descricao}" (em aberto)` })
  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/financeiro/despesas?mes=${dd.vencimento.toISOString().slice(0, 7)}`)
}
