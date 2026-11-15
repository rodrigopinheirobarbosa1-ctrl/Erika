import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpfValido, formatarReais, formatarTelefone, idade, lerData, lerReais, linkWhatsapp } from '../src/lib/formatos'

test('valores em reais', () => {
  assert.equal(lerReais('150'), 15000)
  assert.equal(lerReais('150,50'), 15050)
  assert.equal(lerReais('R$ 1.250,00'), 125000)
  assert.equal(lerReais('1.250'), 125000)
  assert.equal(lerReais('99.9'), 9990)
  assert.equal(lerReais(''), null)
  assert.ok(Number.isNaN(lerReais('abc')))
  assert.equal(formatarReais(125050), 'R$ 1.250,50')
})

test('datas', () => {
  assert.equal(lerData('2026-02-30'), undefined)
  assert.equal(lerData(''), null)
  assert.equal(lerData('1984-10-04')?.toISOString(), '1984-10-04T00:00:00.000Z')
  assert.equal(idade(new Date('1984-10-04T00:00:00Z'), new Date('2026-10-03T12:00:00Z')), 41)
  assert.equal(idade(new Date('1984-10-04T00:00:00Z'), new Date('2026-10-04T12:00:00Z')), 42)
})

test('CPF e telefone', () => {
  assert.equal(cpfValido('529.982.247-25'), true)
  assert.equal(cpfValido('529.982.247-24'), false)
  assert.equal(cpfValido('111.111.111-11'), false)
  assert.equal(formatarTelefone('61999998888'), '(61) 99999-8888')
  assert.equal(linkWhatsapp('(61) 99999-8888'), 'https://wa.me/5561999998888')
})
