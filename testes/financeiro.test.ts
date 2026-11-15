import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cobravel, extrato, limitesDoMes, mesmoDiaMesesDepois, resumoConta, rotuloMes, somarMeses } from '../src/lib/financeiro'

const d = (s: string) => new Date(s)
const sessoes = [
  { id: 's1', inicio: d('2026-11-03T17:00:00Z'), status: 'REALIZADO', valorCentavos: 18000, cobrarFalta: false },
  { id: 's2', inicio: d('2026-11-10T17:00:00Z'), status: 'FALTOU', valorCentavos: 18000, cobrarFalta: false },
  { id: 's3', inicio: d('2026-11-17T17:00:00Z'), status: 'FALTOU', valorCentavos: 18000, cobrarFalta: true },
  { id: 's4', inicio: d('2026-11-24T17:00:00Z'), status: 'DESMARCADO_PACIENTE', valorCentavos: 18000, cobrarFalta: true },
  { id: 's5', inicio: d('2026-12-01T17:00:00Z'), status: 'AGENDADO', valorCentavos: 18000, cobrarFalta: false },
]
const pagamentos = [
  { id: 'p1', data: d('2026-11-05T00:00:00Z'), valorCentavos: 10000, estornadoEm: null },
  { id: 'p2', data: d('2026-11-06T00:00:00Z'), valorCentavos: 99999, estornadoEm: d('2026-11-06T12:00:00Z') },
]

test('o que entra na conta', () => {
  assert.equal(cobravel({ status: 'REALIZADO', cobrarFalta: false }), true)
  assert.equal(cobravel({ status: 'FALTOU', cobrarFalta: false }), false)
  assert.equal(cobravel({ status: 'FALTOU', cobrarFalta: true }), true)
  assert.equal(cobravel({ status: 'DESMARCADO_PACIENTE', cobrarFalta: true }), false)
  assert.equal(cobravel({ status: 'AGENDADO', cobrarFalta: false }), false)
})

test('extrato e saldo (estorno não conta)', () => {
  const e = extrato(sessoes, pagamentos)
  assert.deepEqual(e.map((l) => [l.id, l.saldoCentavos]), [['s1', 18000], ['p1', 8000], ['s3', 26000]])
  assert.deepEqual(resumoConta(sessoes, pagamentos), { devido: 36000, pago: 10000, saldo: 26000, semValor: 0 })
})

test('pagamento adiantado vira crédito; sessão sem valor é apontada', () => {
  const r = resumoConta([{ id: 'x', inicio: d('2026-11-03T17:00:00Z'), status: 'REALIZADO', valorCentavos: null, cobrarFalta: false }], [pagamentos[0]])
  assert.deepEqual(r, { devido: 0, pago: 10000, saldo: -10000, semValor: 1 })
})

test('meses', () => {
  assert.deepEqual(limitesDoMes('2026-12'), { inicio: '2026-12-01', fim: '2027-01-01' })
  assert.equal(somarMeses('2026-11', 3), '2027-02')
  assert.equal(somarMeses('2026-01', -1), '2025-12')
  assert.equal(rotuloMes('2026-11'), 'novembro de 2026')
  assert.equal(mesmoDiaMesesDepois('2026-01-31', 1), '2026-02-28')
  assert.equal(mesmoDiaMesesDepois('2026-01-10', 12), '2027-01-10')
})
