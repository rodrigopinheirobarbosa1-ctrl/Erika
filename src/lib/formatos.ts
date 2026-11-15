// Conversões entre o que a pessoa digita/lê e o que o sistema guarda.
// Código puro: testado em testes/formatos.test.ts.

/** 15000 -> "R$ 150,00" */
export function formatarReais(centavos: number): string {
  const negativo = Math.round(centavos) < 0
  const inteiro = Math.abs(Math.round(centavos))
  const reais = Math.floor(inteiro / 100).toLocaleString('pt-BR')
  return `${negativo ? '-' : ''}R$ ${reais},${String(inteiro % 100).padStart(2, '0')}`
}

/** "150", "150,00", "R$ 1.250,50", "1250.5" -> centavos. Vazio -> null. Inválido -> NaN. */
export function lerReais(texto: string | null | undefined): number | null {
  const limpo = (texto ?? '').replace(/R\$|\s/g, '')
  if (limpo === '') return null
  let normal = limpo
  if (limpo.includes(',')) normal = limpo.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, '')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normal)) return NaN
  return Math.round(Number(normal) * 100)
}

/** "1990-05-03" -> Date à meia-noite UTC. Vazio -> null. Inválido -> undefined. */
export function lerData(texto: string | null | undefined): Date | null | undefined {
  const t = (texto ?? '').trim()
  if (!t) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined
  const d = new Date(`${t}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t ? undefined : d
}

/** Date -> "1990-05-03" (para campos <input type="date">). */
export function dataParaCampo(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

/** Date (meia-noite UTC) -> "03/05/1990". */
export function formatarData(d: Date | null | undefined): string {
  if (!d) return '-'
  const iso = d.toISOString()
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** Data e hora no fuso de Brasília: "15/11/2026 14:30". */
export function formatarDataHora(d: Date): string {
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
}

/** Idade completa em anos na data de hoje. */
export function idade(nascimento: Date, hoje = new Date()): number {
  let anos = hoje.getUTCFullYear() - nascimento.getUTCFullYear()
  const m = hoje.getUTCMonth() - nascimento.getUTCMonth()
  if (m < 0 || (m === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) anos--
  return anos
}

/** Só os dígitos: "(61) 99999-8888" -> "61999998888". */
export function soDigitos(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\D/g, '')
}

/** Confere os dígitos verificadores do CPF. */
export function cpfValido(texto: string): boolean {
  const c = soDigitos(texto)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const digito = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return digito(9) === Number(c[9]) && digito(10) === Number(c[10])
}

/** "98943162120" -> "989.431.621-20" */
export function formatarCpf(texto: string | null | undefined): string {
  const c = soDigitos(texto)
  return c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : (texto ?? '')
}

/** "61999998888" -> "(61) 99999-8888" */
export function formatarTelefone(texto: string | null | undefined): string {
  const t = soDigitos(texto)
  if (t.length === 11) return `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`
  if (t.length === 10) return `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`
  return texto ?? ''
}

/** Link de WhatsApp para um telefone brasileiro. */
export function linkWhatsapp(telefone: string, mensagem?: string): string {
  let t = soDigitos(telefone)
  if (t.length <= 11) t = `55${t}`
  return `https://wa.me/${t}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`
}
