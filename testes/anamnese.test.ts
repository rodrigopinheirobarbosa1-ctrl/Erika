import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MODELO_V1 } from '../src/lib/anamnese/modelo'
import { apresentar, lerRespostas, nomeCampo, nomeOutro, paraCadastro } from '../src/lib/anamnese/respostas'

function form(pares: [string, string][]) {
  const f = new FormData()
  for (const [k, v] of pares) f.append(k, v)
  return f
}

test('lê respostas, "outro" e múltipla escolha', () => {
  const r = lerRespostas(
    MODELO_V1,
    form([
      [nomeCampo('nome'), ' Maria Silva '],
      [nomeCampo('dataNascimento'), '1990-05-03'],
      [nomeCampo('telefone'), '(61) 99999-8888'],
      [nomeCampo('cpf'), '529.982.247-25'],
      [nomeCampo('motivo'), 'Ansiedade no pós-parto'],
      [nomeCampo('tipoParto'), 'Outro'],
      [nomeOutro('tipoParto'), 'Domiciliar'],
      [nomeCampo('pessoasApoio'), 'Família'],
      [nomeCampo('pessoasApoio'), 'Outros'],
      [nomeOutro('pessoasApoio'), 'vizinha'],
      [nomeCampo('seguraAcolhida'), 'Às vezes'],
    ]),
  )
  assert.ok('respostas' in r)
  const c = r.respostas.campos
  assert.equal(c.nome, 'Maria Silva')
  assert.equal(c.telefone, '61999998888')
  assert.equal(c.cpf, '52998224725')
  assert.equal(c.tipoParto, 'Outro: Domiciliar')
  assert.deepEqual(c.pessoasApoio, ['Família', 'Outros: vizinha'])
  assert.equal(r.respostas.versao, 1)
  assert.equal(paraCadastro(r.respostas).motivo, 'Ansiedade no pós-parto')
  const sec = apresentar(MODELO_V1, r.respostas)
  assert.equal(sec[0].itens[1].valor, '03/05/1990')
})

test('validações', () => {
  assert.deepEqual(lerRespostas(MODELO_V1, form([])), { erro: 'Preencha "Nome".' })
  assert.ok('erro' in lerRespostas(MODELO_V1, form([[nomeCampo('nome'), 'A'], [nomeCampo('cpf'), '111.111.111-11']])))
  assert.ok('erro' in lerRespostas(MODELO_V1, form([[nomeCampo('nome'), 'A'], [nomeCampo('seguraAcolhida'), 'Talvez']])))
})

test('numeração igual ao modelo da Érika (bloco extra sem número)', async () => {
  const { numerar } = await import('../src/lib/anamnese/modelo')
  const t = numerar(MODELO_V1)
  assert.equal(t[1], 'Para o seu cadastro')
  assert.equal(t[2], '2. Motivo da consulta')
  assert.equal(t[t.length - 1], '7. Informações adicionais')
})
