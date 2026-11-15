// Mensagens ao paciente (confirmação e lembretes). Código puro
// (testes/mensagens.test.ts).
import { rotuloDia, utcParaLocal } from './horario'

export const TEXTOS_PADRAO = {
  agendamento: 'Olá, {nome}! Sua sessão com a psicóloga Érika Dias está agendada para {data} às {hora}{serie}, {onde}. Qualquer imprevisto, me avise com antecedência. 🌿',
  umDia: 'Olá, {nome}! Passando para lembrar da sua sessão amanhã, {data} às {hora}, {onde}. Até lá! 🌿',
  umaHora: 'Olá, {nome}! Nossa sessão começa em 1 hora, às {hora}, {onde}.',
}

export const VARIAVEIS = [
  ['{nome}', 'primeiro nome (ou nome social) do paciente'],
  ['{data}', 'dia da sessão, ex.: sexta, 20 nov'],
  ['{hora}', 'horário, ex.: 14:30'],
  ['{onde}', 'online com o link / consultório / endereço do domicílio'],
  ['{serie}', 'em sessões semanais: “ (e toda semana no mesmo horário)”'],
] as const

type DadosSessao = {
  inicio: Date
  modalidade: 'PRESENCIAL' | 'ONLINE' | 'DOMICILIO'
  linkOnline: string | null
  serie: boolean
  paciente: { nome: string; nomeSocial: string | null; endereco: string | null; cidade: string | null }
}

export function descreverOnde(s: DadosSessao, enderecoConsultorio: string): string {
  if (s.modalidade === 'ONLINE') return s.linkOnline ? `online, pelo link ${s.linkOnline}` : 'online (o link será enviado antes da sessão)'
  if (s.modalidade === 'DOMICILIO') {
    const end = [s.paciente.endereco, s.paciente.cidade].filter(Boolean).join(', ')
    return end ? `no seu endereço (${end})` : 'no seu endereço'
  }
  return enderecoConsultorio ? `no consultório (${enderecoConsultorio})` : 'no consultório'
}

/** Troca as variáveis do texto pelos dados da sessão. */
export function preencher(texto: string, s: DadosSessao, enderecoConsultorio = ''): string {
  const { data, hora } = utcParaLocal(s.inicio)
  const valores: Record<string, string> = {
    '{nome}': (s.paciente.nomeSocial || s.paciente.nome).split(' ')[0],
    '{data}': rotuloDia(data),
    '{hora}': hora,
    '{onde}': descreverOnde(s, enderecoConsultorio),
    '{serie}': s.serie ? ' (e toda semana no mesmo horário)' : '',
  }
  return texto.replace(/\{(nome|data|hora|onde|serie)\}/g, (v) => valores[v])
}

/** "1440" -> "1 dia antes"; "90" -> "1 h 30 min antes". */
export function rotuloAntecedencia(min: number): string {
  if (min % 1440 === 0) return `${min / 1440} dia${min === 1440 ? '' : 's'} antes`
  const h = Math.floor(min / 60), m = min % 60
  return `${h ? `${h} h` : ''}${h && m ? ' ' : ''}${m ? `${m} min` : ''} antes`
}

type Regra = { id: string; antecedenciaMin: number | null; ativo: boolean }
type SessaoAgenda = { id: string; inicio: Date; status: string; criadoEm: Date }

/**
 * Lembretes "na hora": sessão agendada, já dentro da antecedência da regra,
 * ainda não começou e sem envio (ou pulo) registrado. Sessão marcada depois
 * da janela do lembrete não gera aquele lembrete (já recebeu a confirmação).
 */
export function lembretesPendentes(sessoes: SessaoAgenda[], regras: Regra[], enviados: Set<string>, agora: Date) {
  // Por sessão, vale só o lembrete mais próximo da hora: quando abre o de
  // 1 hora, o de 1 dia (se não foi enviado) sai da lista — senão a mensagem
  // diria "amanhã" para uma sessão que já é hoje.
  const ordenadas = regras.filter((r) => r.ativo && r.antecedenciaMin).sort((a, b) => a.antecedenciaMin! - b.antecedenciaMin!)
  const lista: { sessaoId: string; regraId: string; abreEm: Date }[] = []
  for (const s of sessoes) {
    if (s.status !== 'AGENDADO' || agora >= s.inicio) continue
    const vigente = ordenadas.find((r) => {
      const abre = s.inicio.getTime() - r.antecedenciaMin! * 60000
      return agora.getTime() >= abre && s.criadoEm.getTime() <= abre
    })
    if (!vigente || enviados.has(`${s.id}|${vigente.id}`)) continue
    lista.push({ sessaoId: s.id, regraId: vigente.id, abreEm: new Date(s.inicio.getTime() - vigente.antecedenciaMin! * 60000) })
  }
  return lista
}
