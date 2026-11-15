import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { descriptografar } from '@/lib/cripto'
import { formatarCpf, formatarData, formatarDataHora, formatarReais, formatarTelefone, idade, linkWhatsapp } from '@/lib/formatos'
import { AREAS, MODALIDADES, MODALIDADES_CURTAS, STATUS_ATENDIMENTO, STATUS_PACIENTE, TOM_ATENDIMENTO } from '@/lib/rotulos'
import { rotuloInstante } from '@/lib/horario'
import { escreveProntuario } from '@/lib/permissoes'
import Link from '@/components/link'
import { LinhaDoTempo, NovoRegistro } from '@/components/prontuario'
import { FinanceiroPaciente } from '@/components/financeiro-paciente'
import { Aviso, Cabecalho, Cartao, Dado, Etiqueta, LinkBotao } from '@/components/ui'

export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const { id } = await params
  const p = await db.paciente.findUnique({ where: { id } })
  if (!p) notFound()

  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'Paciente', entidadeId: p.id, resumo: `Abriu a ficha de ${p.nome}` })
  const clinico = podeVerClinico(usuario)
  const queixa = clinico ? descriptografar(p.queixaCripto) : null
  const observacoes = clinico ? descriptografar(p.observacoesCripto) : null
  const agora = new Date()
  const [proximas, anteriores, totais, registros, contaSessoes, pagamentos] = await Promise.all([
    db.atendimento.findMany({ where: { pacienteId: p.id, inicio: { gte: agora } }, orderBy: { inicio: 'asc' }, take: 6 }),
    db.atendimento.findMany({ where: { pacienteId: p.id, inicio: { lt: agora } }, orderBy: { inicio: 'desc' }, take: 10 }),
    db.atendimento.groupBy({ by: ['status'], where: { pacienteId: p.id, inicio: { lt: agora } }, _count: true }),
    clinico
      ? db.registroProntuario.findMany({
          where: { pacienteId: p.id },
          orderBy: { criadoEm: 'desc' },
          include: { atendimento: { select: { id: true, inicio: true } } },
        })
      : Promise.resolve([]),
    db.atendimento.findMany({
      where: { pacienteId: p.id, status: { in: ['REALIZADO', 'FALTOU'] } },
      select: { id: true, inicio: true, status: true, valorCentavos: true, cobrarFalta: true },
    }),
    db.pagamento.findMany({ where: { pacienteId: p.id }, orderBy: { data: 'desc' } }),
  ])
  const conta = (s: string) => totais.find((t) => t.status === s)?._count ?? 0
  const podeEscrever = escreveProntuario(usuario.papel)

  return (
    <div className="mx-auto max-w-4xl">
      <Cabecalho
        titulo={p.nomeSocial || p.nome}
        descricao={`${STATUS_PACIENTE[p.status]}${p.dataNascimento ? ` · ${idade(p.dataNascimento)} anos` : ''}`}
        acoes={
          <>
            {p.telefone && (
              <a href={linkWhatsapp(p.telefone)} target="_blank" rel="noopener noreferrer" className="btn-secundario">
                WhatsApp
              </a>
            )}
            <LinkBotao href={`/sistema/pacientes/${p.id}/editar`} variante="primario">
              Editar cadastro
            </LinkBotao>
          </>
        }
      />

      {!p.consentimentoLgpdEm && (
        <div className="mb-5">
          <Aviso tom="amarelo">Consentimento (LGPD / contrato terapêutico) ainda não registrado para este paciente.</Aviso>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo="Identificação e contato">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Nome completo">{p.nome}</Dado>
            <Dado rotulo="Nascimento">{p.dataNascimento ? formatarData(p.dataNascimento) : ''}</Dado>
            <Dado rotulo="CPF">{formatarCpf(p.cpf)}</Dado>
            <Dado rotulo="Telefone">{formatarTelefone(p.telefone)}</Dado>
            <Dado rotulo="E-mail">{p.email}</Dado>
            <Dado rotulo="Profissão">{p.profissao}</Dado>
            <Dado rotulo="Estado civil">{p.estadoCivil}</Dado>
            <Dado rotulo="Cidade">{p.cidade}</Dado>
            <div className="sm:col-span-2">
              <Dado rotulo="Endereço">{p.endereco}</Dado>
            </div>
            <Dado rotulo="Emergência">{[p.contatoEmergencia, formatarTelefone(p.telefoneEmergencia)].filter(Boolean).join(' · ')}</Dado>
            {p.responsavelNome && (
              <Dado rotulo="Responsável legal">
                {[p.responsavelNome, formatarCpf(p.responsavelCpf), formatarTelefone(p.responsavelTelefone)].filter(Boolean).join(' · ')}
              </Dado>
            )}
          </dl>
        </Cartao>

        <Cartao titulo="Atendimento">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Situação">{STATUS_PACIENTE[p.status]}</Dado>
            <Dado rotulo="Início">{p.inicioAtendimento ? formatarData(p.inicioAtendimento) : ''}</Dado>
            <Dado rotulo="Modalidade">{p.modalidade ? MODALIDADES[p.modalidade] : ''}</Dado>
            <Dado rotulo="Área">{p.area ? AREAS[p.area] : ''}</Dado>
            <Dado rotulo={p.area === 'GESTACAO' ? 'Data provável do parto' : 'Nascimento do bebê'}>
              {p.dataReferenciaBebe ? formatarData(p.dataReferenciaBebe) : ''}
            </Dado>
            <Dado rotulo="Valor por sessão">{p.valorSessaoCentavos != null ? formatarReais(p.valorSessaoCentavos) : ''}</Dado>
            <Dado rotulo="Como conheceu">{p.comoConheceu}</Dado>
            <Dado rotulo="Consentimento LGPD">{p.consentimentoLgpdEm ? formatarDataHora(p.consentimentoLgpdEm) : 'Não registrado'}</Dado>
          </dl>
        </Cartao>

        {clinico && (
          <>
            <Cartao titulo="🔒 Queixa inicial / demanda" className="lg:col-span-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{queixa || '—'}</p>
            </Cartao>
            <Cartao titulo="🔒 Observações gerais" className="lg:col-span-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{observacoes || '—'}</p>
            </Cartao>
          </>
        )}

        <Cartao
          titulo="Sessões"
          className="lg:col-span-2"
          acao={<LinkBotao href={`/sistema/agenda/novo?paciente=${p.id}`}>+ Agendar</LinkBotao>}
        >
          <p className="mb-3 text-xs text-stone-500">
            Até hoje: {conta('REALIZADO')} realizada(s) · {conta('FALTOU')} falta(s) · {conta('DESMARCADO_PACIENTE') + conta('DESMARCADO_PSICOLOGA')} desmarcada(s)
          </p>
          {[
            ['Próximas', proximas],
            ['Anteriores (últimas 10)', anteriores],
          ].map(([rotulo, lista]) => (
            <div key={rotulo as string} className="mb-3">
              <p className="rotulo">{rotulo as string}</p>
              {(lista as typeof proximas).length === 0 ? (
                <p className="text-sm text-stone-400">Nenhuma.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {(lista as typeof proximas).map((a) => (
                    <li key={a.id}>
                      <Link href={`/sistema/agenda/${a.id}`} className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-marca-50">
                        <span>
                          {rotuloInstante(a.inicio)} <span className="text-stone-400">· {MODALIDADES_CURTAS[a.modalidade]}</span>
                        </span>
                        <Etiqueta tom={TOM_ATENDIMENTO[a.status]}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Cartao>

        <FinanceiroPaciente pacienteId={p.id} sessoes={contaSessoes} pagamentos={pagamentos} />

        {clinico && (
          <Cartao
            titulo="🔒 Prontuário"
            className="lg:col-span-2"
            acao={<LinkBotao href={`/sistema/pacientes/${p.id}/prontuario`}>Imprimir / PDF</LinkBotao>}
          >
            {podeEscrever && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-medium text-marca-700">+ Nova anotação (fora de sessão)</summary>
                <div className="mt-3">
                  <NovoRegistro pacienteId={p.id} titulo="Anotação" />
                </div>
              </details>
            )}
            <p className="mb-3 text-xs text-stone-500">
              A evolução de cada sessão é registrada na própria sessão (Agenda → sessão). Mais recentes primeiro.
              {!podeEscrever && ' Seu perfil lê o prontuário, mas só a psicóloga registra.'}
            </p>
            <LinhaDoTempo registros={registros} pacienteId={p.id} podeEscrever={podeEscrever} />
          </Cartao>
        )}
      </div>

      <p className="mt-6 text-xs text-stone-400">
        Cadastrado em {formatarDataHora(p.criadoEm)} · última alteração em {formatarDataHora(p.atualizadoEm)}.
      </p>
    </div>
  )
}
