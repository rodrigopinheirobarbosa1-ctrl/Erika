import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lembretesPendentes, preencher, rotuloAntecedencia, TEXTOS_PADRAO } from '../src/lib/mensagens'
import { localParaUtc } from '../src/lib/horario'

const paciente = { nome: 'Ana Maria Souza', nomeSocial: null, endereco: 'SQN 210 Bl A', cidade: 'Brasília' }
const inicio = localParaUtc('2026-11-20', '14:30')!

test('preenche a mensagem conforme a modalidade', () => {
  assert.equal(
    preencher(TEXTOS_PADRAO.agendamento, { inicio, modalidade: 'ONLINE', linkOnline: 'https://meet.google.com/abc', serie: true, paciente }),
    'Olá, Ana! Sua sessão com a psicóloga Érika Dias está agendada para sexta, 20 nov às 14:30 (e toda semana no mesmo horário), online, pelo link https://meet.google.com/abc. Qualquer imprevisto, me avise com antecedência. 🌿',
  )
  assert.match(preencher('{onde}', { inicio, modalidade: 'DOMICILIO', linkOnline: null, serie: false, paciente }), /no seu endereço \(SQN 210 Bl A, Brasília\)/)
  assert.equal(preencher('{onde}', { inicio, modalidade: 'PRESENCIAL', linkOnline: null, serie: false, paciente }, 'Sala 5'), 'no consultório (Sala 5)')
})

test('rótulos de antecedência', () => {
  assert.equal(rotuloAntecedencia(1440), '1 dia antes')
  assert.equal(rotuloAntecedencia(60), '1 h antes')
  assert.equal(rotuloAntecedencia(90), '1 h 30 min antes')
  assert.equal(rotuloAntecedencia(2880), '2 dias antes')
})

test('lembretes na hora certa', () => {
  const regras = [{ id: 'dia', antecedenciaMin: 1440, ativo: true }, { id: 'hora', antecedenciaMin: 60, ativo: true }]
  const s = { id: 's1', inicio, status: 'AGENDADO', criadoEm: new Date('2026-11-01T00:00:00Z') }
  const ids = (agora: Date, enviados = new Set<string>()) => lembretesPendentes([s], regras, enviados, agora).map((l) => l.regraId)
  assert.deepEqual(ids(localParaUtc('2026-11-19', '10:00')!), []) // ainda cedo
  assert.deepEqual(ids(localParaUtc('2026-11-19', '15:00')!), ['dia'])
  // na última hora vale só o lembrete de 1 hora (o de 1 dia não enviado sai da lista)
  assert.deepEqual(ids(localParaUtc('2026-11-20', '13:45')!), ['hora'])
  assert.deepEqual(ids(localParaUtc('2026-11-20', '13:45')!, new Set(['s1|hora'])), [])
  assert.deepEqual(ids(localParaUtc('2026-11-20', '14:31')!), []) // já começou
  // marcada em cima da hora: sem lembrete de 1 dia
  const tardia = { ...s, criadoEm: localParaUtc('2026-11-20', '09:00')! }
  assert.deepEqual(lembretesPendentes([tardia], regras, new Set(), localParaUtc('2026-11-20', '13:45')!).map((l) => l.regraId), ['hora'])
})
