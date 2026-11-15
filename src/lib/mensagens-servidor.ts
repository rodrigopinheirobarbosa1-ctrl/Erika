import 'server-only'
import { db } from './db'
import { lembretesPendentes, preencher, TEXTOS_PADRAO } from './mensagens'
import { site } from './site'

/**
 * Na primeira vez, cria a confirmação e os lembretes de 1 dia e 1 hora.
 * Os ids são fixos e o skipDuplicates evita criar em dobro quando duas partes
 * da tela (menu e painel) chegam aqui ao mesmo tempo.
 */
export async function garantirModelos() {
  if ((await db.modeloMensagem.count()) > 0) return
  await db.modeloMensagem.createMany({
    skipDuplicates: true,
    data: [
      { id: 'padrao-agendamento', tipo: 'AGENDAMENTO', nome: 'Confirmação do agendamento', texto: TEXTOS_PADRAO.agendamento },
      { id: 'padrao-1-dia', tipo: 'LEMBRETE', nome: 'Lembrete de 1 dia antes', antecedenciaMin: 1440, texto: TEXTOS_PADRAO.umDia },
      { id: 'padrao-1-hora', tipo: 'LEMBRETE', nome: 'Lembrete de 1 hora antes', antecedenciaMin: 60, texto: TEXTOS_PADRAO.umaHora },
    ],
  })
}

export async function modelosAtivos() {
  await garantirModelos()
  const todos = await db.modeloMensagem.findMany({ where: { ativo: true } })
  return todos.sort((a, b) => (a.tipo === b.tipo ? (b.antecedenciaMin ?? 0) - (a.antecedenciaMin ?? 0) : a.tipo === 'AGENDAMENTO' ? -1 : 1))
}

type SessaoMsg = {
  id: string
  inicio: Date
  modalidade: 'PRESENCIAL' | 'ONLINE' | 'DOMICILIO'
  linkOnline: string | null
  serieId: string | null
  paciente: { nome: string; nomeSocial: string | null; endereco: string | null; cidade: string | null; telefone: string | null }
}

export function textoPara(texto: string, s: SessaoMsg) {
  return preencher(texto, { ...s, serie: !!s.serieId }, site.enderecoConsultorio)
}

/** Lembretes para enviar agora, já com o texto pronto. */
export async function lembretesAgora() {
  const regras = (await modelosAtivos()).filter((m) => m.tipo === 'LEMBRETE')
  const maior = Math.max(0, ...regras.map((r) => r.antecedenciaMin ?? 0))
  if (maior === 0) return []
  const agora = new Date()
  const sessoes = await db.atendimento.findMany({
    where: { status: 'AGENDADO', inicio: { gt: agora, lte: new Date(agora.getTime() + maior * 60000) } },
    include: { paciente: { select: { nome: true, nomeSocial: true, endereco: true, cidade: true, telefone: true } }, envios: { select: { modeloId: true } } },
    orderBy: { inicio: 'asc' },
  })
  const enviados = new Set(sessoes.flatMap((s) => s.envios.map((e) => `${s.id}|${e.modeloId}`)))
  return lembretesPendentes(sessoes, regras, enviados, agora).map((p) => {
    const s = sessoes.find((x) => x.id === p.sessaoId)!
    const r = regras.find((x) => x.id === p.regraId)!
    return { sessao: s, regra: r, texto: textoPara(r.texto, s) }
  })
}
