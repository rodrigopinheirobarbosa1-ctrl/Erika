import { test } from 'node:test'
import assert from 'node:assert/strict'
import { descricaoRecibo, gerarArquivo, limparTexto, linhaRecibo, pendencias, valorArquivo } from '../src/lib/receita-saude'

const prof = { cpf: '529.982.247-25', registro: '' }
const item = {
  id: 'p1',
  data: new Date('2026-11-05T00:00:00Z'),
  valorCentavos: 125050,
  cpfPagador: '111.444.777-35',
  cpfBeneficiario: '529.982.247-25',
  descricao: 'Atendimento psicológico; sessão',
}

test('linha no leiaute do manual (16 campos, mesma posição do exemplo oficial)', () => {
  const l = linhaRecibo(item, prof)
  assert.equal(l, '05/11/2026;R01.001.001;255;1250,50;;Atendimento psicologico sessao;PF;11144477735;52998224725;;;;;S;52998224725;')
  assert.equal(l.split(';').length, 16)
  // mesma estrutura do exemplo do manual
  const exemplo = '31/07/2025;R01.001.001;231;250,00;;Sessão de fisioterapia realizada em 31/07/25;PF;12345678900;12345678900;;;;;S;98765432100;BR123-F'
  assert.deepEqual(l.split(';').map((c) => c === ''), exemplo.split(';').map((c, i) => (i === 15 ? true : c === '')))
})

test('valores e textos', () => {
  assert.equal(valorArquivo(25000), '250,00')
  assert.equal(valorArquivo(5), '0,05')
  assert.equal(limparTexto('Ação;\nterapêutica'), 'Acao terapeutica')
})

test('pendências e regras do arquivo', () => {
  assert.deepEqual(pendencias({ ...item, cpfPagador: null }), ['falta o CPF de quem pagou'])
  assert.throws(() => gerarArquivo([item], { cpf: '' }), /CPF da profissional/)
  assert.throws(() => gerarArquivo([item, { ...item, data: new Date('2025-12-30T00:00:00Z') }], prof), /mesmo ano/)
  assert.match(gerarArquivo([item, item], prof), /^05\/11\/2026;.*\r\n05\/11\/2026;.*\r\n$/)
})

test('descrição do recibo com a observação do pagamento (pacote)', () => {
  assert.equal(descricaoRecibo(null), 'Atendimento psicologico (psicoterapia)')
  assert.equal(descricaoRecibo('pacote de 4 sessões, de 24/11 a 15/12'), 'Psicoterapia - pacote de 4 sessoes, de 24/11 a 15/12')
  assert.ok(descricaoRecibo('x'.repeat(400)).length <= 255)
})
