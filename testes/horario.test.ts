import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localParaUtc, rotuloDia, segundaDaSemana, sobrepoe, somarDias, utcParaLocal } from '../src/lib/horario'

test('Brasília <-> UTC', () => {
  const d = localParaUtc('2026-11-20', '14:30')!
  assert.equal(d.toISOString(), '2026-11-20T17:30:00.000Z')
  assert.deepEqual(utcParaLocal(d), { data: '2026-11-20', hora: '14:30' })
  // 22h em Brasília já é o dia seguinte em UTC, mas a tela continua no dia certo
  assert.deepEqual(utcParaLocal(localParaUtc('2026-11-20', '22:00')!), { data: '2026-11-20', hora: '22:00' })
  assert.equal(localParaUtc('2026-02-30', '10:00'), null)
  assert.equal(localParaUtc('2026-11-20', '25:00'), null)
})

test('semanas e dias', () => {
  assert.equal(segundaDaSemana('2026-11-15'), '2026-11-09') // domingo -> segunda anterior
  assert.equal(segundaDaSemana('2026-11-16'), '2026-11-16')
  assert.equal(somarDias('2026-12-30', 3), '2027-01-02')
  assert.equal(rotuloDia('2026-11-20'), 'sexta, 20 nov')
})

test('sobreposição de horários', () => {
  const a = localParaUtc('2026-11-20', '14:00')!
  assert.equal(sobrepoe(a, 50, localParaUtc('2026-11-20', '14:30')!, 50), true)
  assert.equal(sobrepoe(a, 50, localParaUtc('2026-11-20', '14:50')!, 50), false) // encosta, não cruza
})
