import 'server-only'
import { db } from './db'
import { lerData } from './formatos'
import { limitesDoMes } from './financeiro'
import { descricaoRecibo, type ItemRecibo } from './receita-saude'

export async function lerConfig(chave: string): Promise<string | null> {
  return (await db.configuracao.findUnique({ where: { chave } }))?.valor ?? null
}

export async function profissional() {
  const [cpf, registro] = await Promise.all([lerConfig('cpfProfissional'), lerConfig('registroProfissional')])
  return { cpf: cpf ?? '', registro }
}

/**
 * Pagamentos do mês ainda sem recibo emitido, prontos para o arquivo.
 * Quem pagou: o CPF informado no pagamento; sem ele (e sem "pago por"
 * outra pessoa), o do responsável legal ou o do próprio paciente.
 */
export async function pagamentosSemRecibo(mes: string) {
  const { inicio, fim } = limitesDoMes(mes)
  const lista = await db.pagamento.findMany({
    where: { estornadoEm: null, reciboEmitido: false, reciboDispensadoMotivo: null, data: { gte: lerData(inicio)!, lt: lerData(fim)! } },
    orderBy: [{ data: 'asc' }, { criadoEm: 'asc' }],
    include: { paciente: { select: { id: true, nome: true, cpf: true, responsavelCpf: true } } },
  })
  return lista.map((p) => {
    const item: ItemRecibo = {
      id: p.id,
      data: p.data,
      valorCentavos: p.valorCentavos,
      cpfBeneficiario: p.paciente.cpf,
      cpfPagador: p.pagadorCpf ?? (p.pagadorNome ? null : (p.paciente.responsavelCpf ?? p.paciente.cpf)),
      descricao: descricaoRecibo(p.observacao),
    }
    return { item, pagamento: p }
  })
}

/** Pagamentos do mês marcados como "não será emitido recibo". */
export async function recibosDispensados(mes: string) {
  const { inicio, fim } = limitesDoMes(mes)
  return db.pagamento.findMany({
    where: { estornadoEm: null, reciboEmitido: false, reciboDispensadoMotivo: { not: null }, data: { gte: lerData(inicio)!, lt: lerData(fim)! } },
    orderBy: { data: 'asc' },
    include: { paciente: { select: { id: true, nome: true } } },
  })
}
