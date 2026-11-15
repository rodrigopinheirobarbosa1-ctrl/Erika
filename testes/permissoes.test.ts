import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gereUsuarios, podeAtribuir, podeEditar, veClinico, vePacientes } from '../src/lib/permissoes'

test('só a psicóloga vê textos clínicos', () => {
  assert.equal(veClinico('ADMIN'), true)
  assert.equal(veClinico('ASSISTENTE'), false)
  assert.equal(veClinico('SUPORTE'), false)
})

test('suporte não vê pacientes, mas gerencia usuários', () => {
  assert.equal(vePacientes('SUPORTE'), false)
  assert.equal(gereUsuarios('SUPORTE'), true)
  assert.equal(gereUsuarios('ASSISTENTE'), false)
})

test('suporte não cria nem altera administradora', () => {
  assert.equal(podeAtribuir('SUPORTE', 'ADMIN'), false)
  assert.equal(podeAtribuir('SUPORTE', 'ASSISTENTE'), true)
  assert.equal(podeEditar('SUPORTE', 'ADMIN'), false)
  assert.equal(podeAtribuir('ADMIN', 'ADMIN'), true)
})
