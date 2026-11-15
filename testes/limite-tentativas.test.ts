import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JANELA, calcularBloqueio } from '../src/lib/limite-tentativas'

test('libera abaixo do limite e bloqueia ao atingir', () => {
  const agora = Date.now()
  assert.equal(calcularBloqueio(null, 8, agora), 0)
  assert.equal(calcularBloqueio({ erros: 7, primeiraEm: new Date(agora) }, 8, agora), 0)
  assert.equal(calcularBloqueio({ erros: 8, primeiraEm: new Date(agora) }, 8, agora), 15)
})

test('libera depois que a janela de 15 minutos passa', () => {
  const agora = Date.now()
  assert.equal(calcularBloqueio({ erros: 50, primeiraEm: new Date(agora - JANELA - 1) }, 8, agora), 0)
})
