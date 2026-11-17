// Arquivo de emissão em lote do Receita Saúde (Carnê-Leão, e-CAC →
// Escrituração → Importar Escrituração). Leiaute: Manual do Receita Saúde
// v2.1 (out/2025), pergunta 24. Código puro (testes/receita-saude.test.ts).
//
// Linha (16 campos, separados por ";", sem cabeçalho, até 1000 linhas, todas
// do mesmo ano). Exemplo oficial:
// 31/07/2025;R01.001.001;231;250,00;;Sessão de fisioterapia...;PF;12345678900;12345678900;;;;;S;98765432100;BR123-F
import { cpfValido, soDigitos } from './formatos'

export const CODIGO_RENDIMENTO = 'R01.001.001' // trabalho não assalariado
export const CODIGO_OCUPACAO = '255' // psicólogo
export const MAXIMO_LINHAS = 1000

/** Motivos para "não será emitido recibo" num pagamento. */
export const MOTIVOS_SEM_RECIBO = ['Consulta não cobrada / cortesia', 'Pago por empresa (nota fiscal)', 'Lançado só para controle', 'Outro (descreva no detalhe)'] as const

export type ItemRecibo = {
  id: string
  /** Dia do pagamento (meia-noite UTC). */
  data: Date
  valorCentavos: number
  cpfPagador: string | null
  cpfBeneficiario: string | null
  descricao: string
}

export type Profissional = { cpf: string; registro?: string | null }

/**
 * Descrição do recibo. A observação do pagamento entra junto (ex.: "pacote de
 * 4 sessões, de 24/11 a 15/12") — o manual permite incluir as datas dos
 * atendimentos neste campo.
 */
export function descricaoRecibo(observacao: string | null | undefined): string {
  const obs = (observacao ?? '').trim()
  return limparTexto(obs ? `Psicoterapia - ${obs}` : 'Atendimento psicologico (psicoterapia)')
}

/** Tira acentos e caracteres que poderiam quebrar o arquivo (";" e quebras de linha). */
export function limparTexto(t: string, max = 255): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[;\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** 25000 -> "250,00" (sem separador de milhar, como pede o leiaute). */
export const valorArquivo = (c: number) => `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')}`

const dataArquivo = (d: Date) => {
  const iso = d.toISOString()
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** O que impede um pagamento de entrar no arquivo (vazio = pode entrar). */
export function pendencias(i: ItemRecibo): string[] {
  const p: string[] = []
  if (i.valorCentavos <= 0) p.push('valor zerado')
  if (!i.cpfBeneficiario || !cpfValido(i.cpfBeneficiario)) p.push('falta o CPF do paciente')
  if (!i.cpfPagador || !cpfValido(i.cpfPagador)) p.push('falta o CPF de quem pagou')
  return p
}

export function linhaRecibo(i: ItemRecibo, prof: Profissional): string {
  return [
    dataArquivo(i.data),
    CODIGO_RENDIMENTO,
    CODIGO_OCUPACAO,
    valorArquivo(i.valorCentavos),
    '', // valor da dedução: sempre vazio
    limparTexto(i.descricao),
    'PF',
    soDigitos(i.cpfPagador),
    soDigitos(i.cpfBeneficiario),
    '', // ind. CPF não informado
    '', // CNPJ
    '', // indicador de IRRF
    '', // valor IRRF
    'S', // gerar recibo
    soDigitos(prof.cpf),
    limparTexto(prof.registro ?? '', 15),
  ].join(';')
}

/** Arquivo completo. Lança erro se algo estiver fora das regras da Receita. */
export function gerarArquivo(itens: ItemRecibo[], prof: Profissional): string {
  if (!cpfValido(prof.cpf)) throw new Error('CPF da profissional inválido ou não cadastrado.')
  if (itens.length === 0) throw new Error('Nenhum pagamento para incluir.')
  if (itens.length > MAXIMO_LINHAS) throw new Error(`O arquivo aceita até ${MAXIMO_LINHAS} recibos.`)
  const anos = new Set(itens.map((i) => i.data.getUTCFullYear()))
  if (anos.size > 1) throw new Error('Todos os pagamentos do arquivo precisam ser do mesmo ano.')
  const comProblema = itens.find((i) => pendencias(i).length > 0)
  if (comProblema) throw new Error(`Pagamento com pendência: ${pendencias(comProblema).join(', ')}.`)
  return itens.map((i) => linhaRecibo(i, prof)).join('\r\n') + '\r\n'
}
