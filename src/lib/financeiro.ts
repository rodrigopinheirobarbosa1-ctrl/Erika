// Regras do financeiro. Código puro (testes/financeiro.test.ts).
//
// O que o paciente deve não é gravado em lugar nenhum: sai das sessões.
// Entra na conta: sessão REALIZADA, e FALTA marcada para cobrar, pelo valor
// guardado na própria sessão. Desmarcada nunca entra. Pagamento estornado
// não conta.

type SessaoConta = { id: string; inicio: Date; status: string; valorCentavos: number | null; cobrarFalta: boolean }
type PagamentoConta = { id: string; data: Date; valorCentavos: number; estornadoEm: Date | null }

export function cobravel(s: Pick<SessaoConta, 'status' | 'cobrarFalta'>): boolean {
  return s.status === 'REALIZADO' || (s.status === 'FALTOU' && s.cobrarFalta)
}

export type LinhaExtrato = {
  tipo: 'SESSAO' | 'PAGAMENTO'
  id: string
  /** Data do fato: início da sessão ou dia do pagamento. */
  data: Date
  /** Positivo = aumenta o que o paciente deve; negativo = pagamento. */
  valorCentavos: number
  /** Saldo depois desta linha. Positivo = paciente deve; negativo = crédito. */
  saldoCentavos: number
  semValor?: boolean
  falta?: boolean
}

/** Extrato em ordem de data, com o saldo acumulado. */
export function extrato(sessoes: SessaoConta[], pagamentos: PagamentoConta[]): LinhaExtrato[] {
  const linhas: Omit<LinhaExtrato, 'saldoCentavos'>[] = [
    ...sessoes.filter(cobravel).map((s) => ({
      tipo: 'SESSAO' as const,
      id: s.id,
      data: s.inicio,
      valorCentavos: s.valorCentavos ?? 0,
      semValor: s.valorCentavos == null,
      falta: s.status === 'FALTOU',
    })),
    ...pagamentos.filter((p) => !p.estornadoEm).map((p) => ({ tipo: 'PAGAMENTO' as const, id: p.id, data: p.data, valorCentavos: -p.valorCentavos })),
  ].sort((a, b) => a.data.getTime() - b.data.getTime() || (a.tipo === 'SESSAO' ? -1 : 1))

  let saldo = 0
  return linhas.map((l) => ({ ...l, saldoCentavos: (saldo += l.valorCentavos) }))
}

export function resumoConta(sessoes: SessaoConta[], pagamentos: PagamentoConta[]) {
  const devido = sessoes.filter(cobravel).reduce((t, s) => t + (s.valorCentavos ?? 0), 0)
  const pago = pagamentos.filter((p) => !p.estornadoEm).reduce((t, p) => t + p.valorCentavos, 0)
  const semValor = sessoes.filter((s) => cobravel(s) && s.valorCentavos == null).length
  return { devido, pago, saldo: devido - pago, semValor }
}

/** "2026-11" válido? */
export const mesValido = (m: string | undefined): m is string => !!m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m)

/** Primeiro dia do mês e do mês seguinte, "AAAA-MM-DD". */
export function limitesDoMes(mes: string): { inicio: string; fim: string } {
  const [a, m] = mes.split('-').map(Number)
  const prox = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
  return { inicio: `${mes}-01`, fim: `${prox}-01` }
}

export function somarMeses(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number)
  const total = a * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
/** "2026-11" -> "novembro de 2026" */
export const rotuloMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`

/** Mesmo dia em outro mês; se o mês for mais curto, o último dia dele (31/01 -> 28/02). */
export function mesmoDiaMesesDepois(data: string, n: number): string {
  const dia = Number(data.slice(8, 10))
  const mes = somarMeses(data.slice(0, 7), n)
  const [a, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return `${mes}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`
}
