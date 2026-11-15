import { notFound } from 'next/navigation'
import type { StatusAtendimento } from '@prisma/client'
import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { formatarReais, linkWhatsapp } from '@/lib/formatos'
import { rotuloInstante, utcParaLocal } from '@/lib/horario'
import { escreveProntuario } from '@/lib/permissoes'
import { MODALIDADES, STATUS_ATENDIMENTO, TOM_ATENDIMENTO } from '@/lib/rotulos'
import { cobravel } from '@/lib/financeiro'
import { Cabecalho, Cartao, Dado, Etiqueta, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { LinhaDoTempo, NovoRegistro } from '@/components/prontuario'
import { alterarAtendimento, excluirAgendamento, mudarStatus } from '../actions'

const RAPIDOS: { status: StatusAtendimento; texto: string }[] = [
  { status: 'REALIZADO', texto: 'Realizado' },
  { status: 'FALTOU', texto: 'Faltou' },
  { status: 'DESMARCADO_PACIENTE', texto: 'Paciente desmarcou' },
  { status: 'DESMARCADO_PSICOLOGA', texto: 'Psicóloga desmarcou' },
]

export default async function Sessao({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const { id } = await params
  const a = await db.atendimento.findUnique({
    where: { id },
    include: {
      paciente: true,
      registros: { orderBy: { criadoEm: 'asc' } },
    },
  })
  if (!a) notFound()
  const clinico = podeVerClinico(usuario)
  if (clinico && a.registros.length > 0) {
    await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'Prontuario', entidadeId: a.pacienteId, resumo: `Abriu o registro da sessão de ${a.paciente.nome} (${rotuloInstante(a.inicio)})` })
  }
  const { data, hora } = utcParaLocal(a.inicio)
  const p = a.paciente
  const futuraDaSerie = a.serieId ? await db.atendimento.count({ where: { serieId: a.serieId, inicio: { gt: a.inicio }, status: 'AGENDADO' } }) : 0

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho
        titulo={p.nomeSocial || p.nome}
        descricao={`${rotuloInstante(a.inicio)} · ${a.duracaoMin} min`}
        acoes={<LinkBotao href={`/sistema/agenda?semana=${data}`}>Agenda</LinkBotao>}
      />

      <div className="space-y-5">
        <Cartao titulo="Sessão" acao={<Etiqueta tom={TOM_ATENDIMENTO[a.status]}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Modalidade">{MODALIDADES[a.modalidade]}</Dado>
            <Dado rotulo="Valor da sessão">
              {a.valorCentavos != null ? formatarReais(a.valorCentavos) : 'Sem valor definido'}
              <span className="block text-xs text-stone-500">
                {cobravel(a)
                  ? 'Entra na conta do paciente.'
                  : a.status === 'FALTOU'
                    ? 'Falta não cobrada (dá para mudar em "Remarcar ou alterar").'
                    : a.status === 'AGENDADO'
                      ? 'Entra na conta quando for marcada como realizada.'
                      : 'Não entra na conta.'}
              </span>
            </Dado>
            {a.modalidade === 'ONLINE' && (
              <Dado rotulo="Videochamada">
                {a.linkOnline ? (
                  <a href={a.linkOnline} target="_blank" rel="noopener noreferrer" className="text-marca-700 underline">
                    Abrir link
                  </a>
                ) : (
                  'Sem link cadastrado'
                )}
              </Dado>
            )}
            {a.modalidade === 'DOMICILIO' && (
              <Dado rotulo="Endereço">
                {p.endereco ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.endereco} ${p.cidade ?? ''}`)}`} target="_blank" rel="noopener noreferrer" className="text-marca-700 underline">
                    {p.endereco}
                    {p.cidade ? `, ${p.cidade}` : ''}
                  </a>
                ) : (
                  'Endereço não cadastrado na ficha'
                )}
              </Dado>
            )}
            {a.recado && <Dado rotulo="Recado">{a.recado}</Dado>}
            <Dado rotulo="Paciente">
              <Link href={`/sistema/pacientes/${p.id}`} className="text-marca-700 underline">
                Abrir ficha
              </Link>
              {p.telefone && (
                <>
                  {' · '}
                  <a href={linkWhatsapp(p.telefone)} target="_blank" rel="noopener noreferrer" className="text-marca-700 underline">
                    WhatsApp
                  </a>
                </>
              )}
            </Dado>
          </dl>

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="rotulo">Marcar como</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RAPIDOS.filter((r) => r.status !== a.status).map((r) => (
                <Formulario key={r.status} action={mudarStatus.bind(null, a.id)}>
                  <input type="hidden" name="status" value={r.status} />
                  <BotaoEnviar variante={r.status === 'REALIZADO' ? 'primario' : 'secundario'}>{r.texto}</BotaoEnviar>
                </Formulario>
              ))}
            </div>
            {futuraDaSerie > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-marca-700">Desmarcar esta e as próximas {futuraDaSerie} da série semanal</summary>
                <Formulario action={mudarStatus.bind(null, a.id)} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="serie" value="on" />
                  <Selecao
                    rotulo="Quem desmarcou"
                    nome="status"
                    valor="DESMARCADO_PACIENTE"
                    opcoes={[
                      { valor: 'DESMARCADO_PACIENTE', texto: 'Paciente' },
                      { valor: 'DESMARCADO_PSICOLOGA', texto: 'Psicóloga' },
                    ]}
                  />
                  <BotaoEnviar variante="perigo" confirmar={`Desmarcar esta e as próximas ${futuraDaSerie} sessões?`}>
                    Desmarcar série
                  </BotaoEnviar>
                </Formulario>
              </details>
            )}
          </div>
        </Cartao>

        {clinico && (
          <Cartao titulo="🔒 Prontuário desta sessão">
            <LinhaDoTempo registros={a.registros} pacienteId={p.id} podeEscrever={escreveProntuario(usuario.papel)} mostrarSessao={false} />
            {escreveProntuario(usuario.papel) && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <NovoRegistro pacienteId={p.id} atendimentoId={a.id} titulo={a.registros.length ? 'Complementar a evolução' : 'Evolução da sessão'} />
                {a.status === 'AGENDADO' && <p className="mt-2 text-xs text-stone-400">Ao salvar, a sessão é marcada como realizada.</p>}
              </div>
            )}
          </Cartao>
        )}

        <Cartao titulo="Remarcar ou alterar">
          <Formulario action={alterarAtendimento.bind(null, a.id)} className="grid gap-4 sm:grid-cols-2">
            <Texto rotulo="Data" nome="data" tipo="date" valor={data} obrigatorio />
            <label className="block">
              <span className="rotulo">Horário</span>
              <input type="time" name="hora" required step={300} defaultValue={hora} className="campo" />
            </label>
            <Texto rotulo="Duração (minutos)" nome="duracaoMin" tipo="number" valor={a.duracaoMin} modo="numeric" obrigatorio />
            <Selecao rotulo="Modalidade" nome="modalidade" valor={a.modalidade} opcoes={Object.entries(MODALIDADES).map(([valor, texto]) => ({ valor, texto }))} />
            <Selecao rotulo="Situação" nome="status" valor={a.status} opcoes={Object.entries(STATUS_ATENDIMENTO).map(([valor, texto]) => ({ valor, texto }))} />
            <Texto rotulo="Link da videochamada" nome="linkOnline" valor={a.linkOnline} />
            <Texto
              rotulo="Valor desta sessão (R$)"
              nome="valor"
              modo="decimal"
              valor={a.valorCentavos != null ? (a.valorCentavos / 100).toFixed(2).replace('.', ',') : ''}
              dica="0 = sem cobrança (cortesia)."
            />
            <div className="flex items-end pb-2">
              <Caixa rotulo="Cobrar se for falta" nome="cobrarFalta" marcado={a.cobrarFalta} />
            </div>
            <Texto rotulo="Recado de agenda (não clínico)" nome="recado" valor={a.recado} maximo={300} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Caixa rotulo="Salvar mesmo com conflito de horário" nome="ignorarConflito" />
            </div>
            <div className="sm:col-span-2">
              <BotaoEnviar>Salvar alterações</BotaoEnviar>
            </div>
          </Formulario>
          {a.status === 'AGENDADO' && a.registros.length === 0 && (
            <Formulario action={excluirAgendamento.bind(null, a.id)} className="mt-4 border-t border-stone-100 pt-4">
              <BotaoEnviar variante="perigo" confirmar="Excluir este agendamento? Use só para agendamento feito por engano.">
                Excluir agendamento (feito por engano)
              </BotaoEnviar>
            </Formulario>
          )}
        </Cartao>
      </div>
    </div>
  )
}
