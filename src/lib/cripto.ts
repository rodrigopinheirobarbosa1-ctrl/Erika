/**
 * Criptografia dos textos sensíveis (dados de saúde) antes de irem ao banco.
 *
 * AES-256-GCM: além de embaralhar, detecta qualquer alteração no texto
 * guardado. A chave de 256 bits vem da variável CHAVE_CRIPTOGRAFIA (uma frase
 * longa), transformada com scrypt. Cada texto usa um "iv" aleatório próprio,
 * então o mesmo texto gravado duas vezes fica diferente no banco.
 *
 * Formato gravado: "v1:<iv>:<etiqueta>:<conteúdo>" (base64).
 * Código puro, sem banco: testado diretamente em testes/cripto.test.ts.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

let chaveEmCache: { frase: string; chave: Buffer } | null = null

function chave(): Buffer {
  const frase = process.env.CHAVE_CRIPTOGRAFIA ?? ''
  if (frase.length < 32) {
    throw new Error('CHAVE_CRIPTOGRAFIA não configurada (precisa de 32 caracteres ou mais).')
  }
  if (chaveEmCache?.frase !== frase) {
    // O "sal" é fixo de propósito: a mesma frase precisa gerar sempre a mesma chave.
    chaveEmCache = { frase, chave: scryptSync(frase, 'erika-dias-psicologa', 32) }
  }
  return chaveEmCache.chave
}

export function criptografar(texto: string | null | undefined): string | null {
  if (texto === null || texto === undefined || texto.trim() === '') return null
  const iv = randomBytes(12)
  const cifra = createCipheriv('aes-256-gcm', chave(), iv)
  const conteudo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()])
  const etiqueta = cifra.getAuthTag()
  return ['v1', iv.toString('base64'), etiqueta.toString('base64'), conteudo.toString('base64')].join(':')
}

export function descriptografar(guardado: string | null | undefined): string | null {
  if (!guardado) return null
  const [versao, iv, etiqueta, conteudo] = guardado.split(':')
  if (versao !== 'v1' || !iv || !etiqueta || conteudo === undefined) {
    throw new Error('Texto criptografado em formato desconhecido.')
  }
  const decifra = createDecipheriv('aes-256-gcm', chave(), Buffer.from(iv, 'base64'))
  decifra.setAuthTag(Buffer.from(etiqueta, 'base64'))
  return Buffer.concat([decifra.update(Buffer.from(conteudo, 'base64')), decifra.final()]).toString('utf8')
}
