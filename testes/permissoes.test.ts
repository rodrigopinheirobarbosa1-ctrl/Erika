import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escreveProntuario, veAgenda, gereUsuarios, podeAtribuir, podeEditar, veClinico, veHistorico, vePacientes } from '../src/lib/permissoes'

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

test('administrador do sistema vê tudo, e o suporte não mexe nele', () => {
  assert.equal(veClinico('TOTAL'), true)
  assert.equal(veHistorico('TOTAL'), true)
  assert.equal(gereUsuarios('TOTAL'), true)
  assert.equal(podeAtribuir('SUPORTE', 'TOTAL'), false)
  assert.equal(podeEditar('SUPORTE', 'TOTAL'), false)
  assert.equal(podeEditar('ADMIN', 'TOTAL'), true) // a psicóloga pode desativá-lo
})

test('agenda e prontuário', () => {
  assert.equal(veAgenda('ASSISTENTE'), true)
  assert.equal(veAgenda('SUPORTE'), false)
  assert.equal(escreveProntuario('ADMIN'), true)
  assert.equal(escreveProntuario('TOTAL'), false) // lê, mas não escreve
  assert.equal(veClinico('TOTAL'), true)
})
