// Sala de videochamada fixa por paciente. Código puro (testes/video.test.ts).
import { randomBytes } from 'node:crypto'

const LETRAS = 'abcdefghijkmnpqrstuvwxyz23456789' // sem 0/o/1/l, que confundem

/**
 * Endereço de uma sala nova no Jitsi Meet (gratuito, sem conta para o
 * paciente). O nome é aleatório (14 caracteres, ~70 bits): impossível de
 * adivinhar e sem o nome do paciente, por sigilo.
 */
export function novaSalaJitsi(): string {
  const bytes = randomBytes(14)
  const codigo = Array.from(bytes, (b) => LETRAS[b % LETRAS.length]).join('')
  return `https://meet.jit.si/ErikaDias-${codigo}`
}

/** Link da sessão online: o da própria sessão ou, se vazio, a sala do paciente. */
export function linkDaSessao(linkOnline: string | null, salaPaciente: string | null): string | null {
  return linkOnline || salaPaciente || null
}
