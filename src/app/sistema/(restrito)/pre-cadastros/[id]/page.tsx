import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { descriptografar } from '@/lib/cripto'
import { formatarDataHora, formatarTelefone, linkWhatsapp } from '@/lib/formatos'
import { AREAS, MODALIDADES, STATUS_PRE } from '@/lib/rotulos'
import { Cabecalho, Cartao, Dado, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { AreaTexto, Selecao } from '@/components/campos'
import { atualizarPreCadastro } from '../actions'

export default async function PedidoDeContato({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const clinico = podeVerClinico(usuario)
  const { id } = await params
  const p = await db.preCadastro.findUnique({ where: { id } })
  if (!p) notFound()
  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'PreCadastro', entidadeId: p.id, resumo: `Abriu o pedido de contato de ${p.nome}` })

  const primeiroNome = p.nome.split(' ')[0]
  const mensagem = `Olá, ${primeiroNome}! Aqui é a Érika Dias, psicóloga. Recebi seu contato pelo site e gostaria de conversar sobre o atendimento.`

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho
        titulo={p.nome}
        descricao={`Recebido em ${formatarDataHora(p.criadoEm)} · ${STATUS_PRE[p.status]}`}
        acoes={<LinkBotao href="/sistema/pre-cadastros">Voltar</LinkBotao>}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <a href={linkWhatsapp(p.telefone, mensagem)} target="_blank" rel="noopener noreferrer" className="btn-primario">
          Responder pelo WhatsApp
        </a>
        <a href={`tel:+55${p.telefone}`} className="btn-secundario">
          Ligar
        </a>
        {p.pacienteId ? (
          <LinkBotao href={`/sistema/pacientes/${p.pacienteId}`}>Ver ficha do paciente</LinkBotao>
        ) : (
          <LinkBotao href={`/sistema/pacientes/novo?pre=${p.id}`}>Cadastrar como paciente</LinkBotao>
        )}
      </div>

      <div className="space-y-5">
        <Cartao titulo="O que a pessoa enviou">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Telefone">{formatarTelefone(p.telefone)}</Dado>
            <Dado rotulo="E-mail">{p.email}</Dado>
            <Dado rotulo="Modalidade">{p.modalidade ? MODALIDADES[p.modalidade] : ''}</Dado>
            <Dado rotulo="Assunto">{p.area ? AREAS[p.area] : ''}</Dado>
            <Dado rotulo="Melhor horário">{p.melhorHorario}</Dado>
            <Dado rotulo="Consentimento">{formatarDataHora(p.consentimentoEm)}</Dado>
            {clinico && (
              <div className="sm:col-span-2">
                <Dado rotulo="🔒 Motivo da procura">{descriptografar(p.motivoCripto)}</Dado>
              </div>
            )}
          </dl>
        </Cartao>

        <Cartao titulo="Acompanhamento">
          <Formulario action={atualizarPreCadastro.bind(null, p.id)} className="space-y-4">
            {p.pacienteId ? (
              <input type="hidden" name="status" value="EM_CONTATO" />
            ) : (
              <Selecao
                rotulo="Situação"
                nome="status"
                valor={p.status === 'CONVERTIDO' ? 'EM_CONTATO' : p.status}
                opcoes={[
                  { valor: 'NOVO', texto: 'Novo (ainda não respondi)' },
                  { valor: 'EM_CONTATO', texto: 'Em contato' },
                  { valor: 'DESCARTADO', texto: 'Descartado / não seguiu' },
                ]}
              />
            )}
            {clinico && <AreaTexto rotulo="🔒 Anotações sobre o contato" nome="observacao" valor={descriptografar(p.observacaoCripto)} linhas={3} />}
            <BotaoEnviar>Salvar</BotaoEnviar>
          </Formulario>
        </Cartao>
      </div>
    </div>
  )
}
