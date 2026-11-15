import 'server-only'
import { db } from './db'
import { cobravel } from './financeiro'

export type SaldoPaciente = { pacienteId: string; nome: string; devido: number; pago: number; saldo: number; semValor: number }

/**
 * Saldo de cada paciente: sessões que entram na conta menos pagamentos não
 * estornados. Busca só as colunas necessárias (transferência do banco custa).
 */
export async function saldosPorPaciente(): Promise<SaldoPaciente[]> {
  const [sessoes, pagos, pacientes] = await Promise.all([
    db.atendimento.findMany({
      where: { status: { in: ['REALIZADO', 'FALTOU'] } },
      select: { pacienteId: true, status: true, valorCentavos: true, cobrarFalta: true },
    }),
    db.pagamento.groupBy({ by: ['pacienteId'], where: { estornadoEm: null }, _sum: { valorCentavos: true } }),
    db.paciente.findMany({ select: { id: true, nome: true, nomeSocial: true } }),
  ])
  const mapa = new Map<string, SaldoPaciente>()
  for (const p of pacientes) mapa.set(p.id, { pacienteId: p.id, nome: p.nomeSocial || p.nome, devido: 0, pago: 0, saldo: 0, semValor: 0 })
  for (const s of sessoes) {
    const c = mapa.get(s.pacienteId)
    if (!c || !cobravel(s)) continue
    if (s.valorCentavos == null) c.semValor++
    else c.devido += s.valorCentavos
  }
  for (const p of pagos) {
    const c = mapa.get(p.pacienteId)
    if (c) c.pago = p._sum.valorCentavos ?? 0
  }
  return [...mapa.values()].map((c) => ({ ...c, saldo: c.devido - c.pago }))
}
