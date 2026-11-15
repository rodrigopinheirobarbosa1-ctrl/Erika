import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { descriptografar } from '@/lib/cripto'
import { formatarCpf, formatarData, formatarDataHora, formatarReais, formatarTelefone, idade, linkWhatsapp } from '@/lib/formatos'
import { AREAS, MODALIDADES, STATUS_PACIENTE } from '@/lib/rotulos'
import { Aviso, Cabecalho, Cartao, Dado, LinkBotao } from '@/components/ui'

export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirUsuario()
  const { id } = await params
  const p = await db.paciente.findUnique({ where: { id } })
  if (!p) notFound()

  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'Paciente', entidadeId: p.id, resumo: `Abriu a ficha de ${p.nome}` })
  const queixa = descriptografar(p.queixaCripto)
  const observacoes = descriptografar(p.observacoesCripto)

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

        <Cartao titulo="🔒 Queixa inicial / demanda" className="lg:col-span-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{queixa || '—'}</p>
        </Cartao>
        <Cartao titulo="🔒 Observações gerais" className="lg:col-span-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{observacoes || '—'}</p>
        </Cartao>
      </div>

      <p className="mt-6 text-xs text-stone-400">
        Cadastrado em {formatarDataHora(p.criadoEm)} · última alteração em {formatarDataHora(p.atualizadoEm)}. Sessões, prontuário e
        pagamentos chegam nas próximas etapas.
      </p>
    </div>
  )
}
