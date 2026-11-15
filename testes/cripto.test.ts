import { test } from 'node:test'
import assert from 'node:assert/strict'

import { criptografar, descriptografar } from '../src/lib/cripto'

// A chave é lida na hora de usar, então basta defini-la antes dos testes.
process.env.CHAVE_CRIPTOGRAFIA = 'uma-frase-de-teste-com-mais-de-32-caracteres'

test('criptografa e lê de volta, inclusive acentos', () => {
  const texto = 'Ansiedade no pós-parto; dificuldade para dormir.'
  const guardado = criptografar(texto)!
  assert.ok(guardado.startsWith('v1:'))
  assert.ok(!guardado.includes('Ansiedade'))
  assert.equal(descriptografar(guardado), texto)
})

test('o mesmo texto fica diferente a cada gravação', () => {
  assert.notEqual(criptografar('igual'), criptografar('igual'))
})

test('vazio vira nulo', () => {
  assert.equal(criptografar('   '), null)
  assert.equal(descriptografar(null), null)
})

test('texto adulterado é recusado', () => {
  const partes = criptografar('segredo')!.split(':')
  partes[3] = Buffer.from('outra coisa').toString('base64')
  assert.throws(() => descriptografar(partes.join(':')))
})

test('chave errada não consegue ler', () => {
  const guardado = criptografar('segredo')!
  process.env.CHAVE_CRIPTOGRAFIA = 'outra-frase-diferente-com-mais-de-32-caracteres'
  assert.throws(() => descriptografar(guardado))
  process.env.CHAVE_CRIPTOGRAFIA = 'uma-frase-de-teste-com-mais-de-32-caracteres'
})
