// Leitura, validação e apresentação das respostas da ficha. Código puro
// (testes/anamnese.test.ts).
import { cpfValido, formatarCpf, formatarData, formatarTelefone, lerData, soDigitos } from '../formatos'
import { CAMPOS_CADASTRO, numerar, type Campo, type Modelo } from './modelo'

export type Respostas = { versao: number; campos: Record<string, string | string[]> }

const LIMITE_CURTO = 200
const LIMITE_LONGO = 5000

/** Nome do campo no formulário HTML. */
export const nomeCampo = (id: string) => `c_${id}`
export const nomeOutro = (id: string) => `c_${id}__outro`

/** Lê o formulário enviado pelo paciente. Devolve as respostas ou a mensagem de erro. */
export function lerRespostas(modelo: Modelo, dados: FormData): { respostas: Respostas } | { erro: string } {
  const campos: Record<string, string | string[]> = {}
  for (const secao of modelo.secoes) {
    for (const c of secao.campos) {
      const bruto = (n: string) => String(dados.get(n) ?? '').trim()
      if (c.tipo === 'multipla') {
        const marcados = dados.getAll(nomeCampo(c.id)).map(String).filter((v) => c.opcoes.includes(v) || v === c.outro)
        const outro = bruto(nomeOutro(c.id)).slice(0, LIMITE_CURTO)
        const lista = marcados.map((v) => (v === c.outro && outro ? `${c.outro}: ${outro}` : v))
        if (outro && c.outro && !marcados.includes(c.outro)) lista.push(`${c.outro}: ${outro}`)
        if (lista.length) campos[c.id] = lista
        continue
      }
      const v = bruto(nomeCampo(c.id))
      if (c.tipo === 'escolha') {
        const outro = bruto(nomeOutro(c.id)).slice(0, LIMITE_CURTO)
        if (v && !c.opcoes.includes(v) && v !== c.outro) return { erro: `Resposta inválida em "${c.rotulo}".` }
        if (v === c.outro || (!v && outro && c.outro)) campos[c.id] = outro ? `${c.outro}: ${outro}` : c.outro!
        else if (v) campos[c.id] = v
        continue
      }
      if (!v) {
        if ('obrigatorio' in c && c.obrigatorio) return { erro: `Preencha "${c.rotulo}".` }
        continue
      }
      if (c.tipo === 'data' && !lerData(v)) return { erro: `Data inválida em "${c.rotulo}".` }
      if (c.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { erro: 'E-mail inválido.' }
      if (c.tipo === 'cpf' && !cpfValido(v)) return { erro: 'CPF inválido. Confira os números (ou deixe em branco).' }
      if (c.tipo === 'telefone' && soDigitos(v).length < 10) return { erro: `Informe o telefone com DDD em "${c.rotulo}".` }
      campos[c.id] = c.tipo === 'cpf' || c.tipo === 'telefone' ? soDigitos(v) : v.slice(0, c.tipo === 'longo' ? LIMITE_LONGO : LIMITE_CURTO)
    }
  }
  return { respostas: { versao: modelo.versao, campos } }
}

function mostrar(c: Campo, v: string | string[] | undefined): string {
  if (v === undefined || v === '') return ''
  if (Array.isArray(v)) return v.join(', ')
  if (c.tipo === 'data') return formatarData(lerData(v) ?? null)
  if (c.tipo === 'telefone') return formatarTelefone(v)
  if (c.tipo === 'cpf') return formatarCpf(v)
  return v
}

/** Respostas organizadas por seção, para a tela e a impressão. */
export function apresentar(modelo: Modelo, r: Respostas) {
  const titulos = numerar(modelo)
  return modelo.secoes.map((s, i) => ({
    titulo: titulos[i],
    itens: s.campos.map((c) => ({ rotulo: c.rotulo, valor: mostrar(c, r.campos[c.id]) })),
  }))
}

/** Dados de cadastro (não clínicos) + motivo, para pré-preencher o paciente. */
export function paraCadastro(r: Respostas) {
  const pegar = (id: string) => {
    const v = r.campos[id]
    return typeof v === 'string' ? v : null
  }
  const cadastro = Object.fromEntries(CAMPOS_CADASTRO.map((id) => [id, pegar(id)])) as Record<(typeof CAMPOS_CADASTRO)[number], string | null>
  return { ...cadastro, motivo: pegar('motivo') }
}
