import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linkDaSessao, novaSalaJitsi } from '../src/lib/video'

test('sala Jitsi aleatória e sem dados do paciente', () => {
  const a = novaSalaJitsi(), b = novaSalaJitsi()
  assert.match(a, /^https:\/\/meet\.jit\.si\/ErikaDias-[a-z2-9]{14}$/)
  assert.notEqual(a, b)
})

test('link da sessão cai na sala do paciente', () => {
  assert.equal(linkDaSessao(null, 'https://meet.jit.si/x'), 'https://meet.jit.si/x')
  assert.equal(linkDaSessao('https://zoom.us/j/1', 'https://meet.jit.si/x'), 'https://zoom.us/j/1')
  assert.equal(linkDaSessao('', null), null)
})
