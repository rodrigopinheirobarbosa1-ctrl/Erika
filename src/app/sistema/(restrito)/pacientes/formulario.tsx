'use client'

import type { Paciente } from '@prisma/client'
import { BotaoEnviar, Formulario } from '@/components/form'
import { AreaTexto, Caixa, Selecao, Texto } from '@/components/campos'
import { dataParaCampo, formatarCpf, formatarTelefone } from '@/lib/formatos'
import { AREAS, MODALIDADES, STATUS_PACIENTE, opcoes } from '@/lib/rotulos'
import { salvarPaciente } from './actions'

export type DadosFormulario = Partial<Omit<Paciente, 'queixaCripto' | 'observacoesCripto'>> & {
  queixa?: string | null
  observacoes?: string | null
  preCadastroId?: string
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="cartao p-4 sm:p-5">
      <legend className="sr-only">{titulo}</legend>
      <h2 className="mb-4 font-serif text-xl text-cacau">{titulo}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function FormularioPaciente({ id, p, clinico }: { id: string | null; p: DadosFormulario; clinico: boolean }) {
  const valor = p.valorSessaoCentavos != null ? (p.valorSessaoCentavos / 100).toFixed(2).replace('.', ',') : ''
  return (
    <Formulario action={salvarPaciente.bind(null, id)} className="space-y-5">
      {p.preCadastroId && <input type="hidden" name="preCadastroId" value={p.preCadastroId} />}

      <Bloco titulo="Identificação">
        <Texto rotulo="Nome completo *" nome="nome" valor={p.nome} obrigatorio className="sm:col-span-2" />
        <Texto rotulo="Nome social / como prefere ser chamada(o)" nome="nomeSocial" valor={p.nomeSocial} />
        <Texto rotulo="Data de nascimento" nome="dataNascimento" tipo="date" valor={dataParaCampo(p.dataNascimento)} />
        <Texto rotulo="CPF" nome="cpf" valor={formatarCpf(p.cpf)} modo="numeric" placeholder="000.000.000-00" />
        <Texto rotulo="Profissão" nome="profissao" valor={p.profissao} />
        <Texto rotulo="Estado civil" nome="estadoCivil" valor={p.estadoCivil} />
      </Bloco>

      <Bloco titulo="Contato">
        <Texto rotulo="Telefone / WhatsApp" nome="telefone" tipo="tel" modo="tel" valor={formatarTelefone(p.telefone)} />
        <Texto rotulo="E-mail" nome="email" tipo="email" valor={p.email} />
        <Texto rotulo="Endereço" nome="endereco" valor={p.endereco} className="sm:col-span-2" dica="Obrigatório na prática para atendimento em domicílio." />
        <Texto rotulo="Cidade" nome="cidade" valor={p.cidade} />
        <div className="hidden sm:block" />
        <Texto rotulo="Contato de emergência (nome)" nome="contatoEmergencia" valor={p.contatoEmergencia} />
        <Texto rotulo="Telefone de emergência" nome="telefoneEmergencia" tipo="tel" modo="tel" valor={formatarTelefone(p.telefoneEmergencia)} />
      </Bloco>

      <Bloco titulo="Responsável legal (se menor de idade)">
        <Texto rotulo="Nome do responsável" nome="responsavelNome" valor={p.responsavelNome} className="sm:col-span-2" />
        <Texto rotulo="CPF do responsável" nome="responsavelCpf" valor={formatarCpf(p.responsavelCpf)} modo="numeric" />
        <Texto rotulo="Telefone do responsável" nome="responsavelTelefone" tipo="tel" modo="tel" valor={formatarTelefone(p.responsavelTelefone)} />
      </Bloco>

      <Bloco titulo="Atendimento">
        <Selecao rotulo="Situação" nome="status" opcoes={opcoes(STATUS_PACIENTE)} valor={p.status ?? 'ATIVO'} />
        <Texto rotulo="Início do atendimento" nome="inicioAtendimento" tipo="date" valor={dataParaCampo(p.inicioAtendimento)} />
        <Selecao rotulo="Modalidade" nome="modalidade" opcoes={opcoes(MODALIDADES)} valor={p.modalidade} vazio="—" />
        <Selecao rotulo="Área" nome="area" opcoes={opcoes(AREAS)} valor={p.area} vazio="—" />
        <Texto
          rotulo="Data provável do parto / nascimento do bebê"
          nome="dataReferenciaBebe"
          tipo="date"
          valor={dataParaCampo(p.dataReferenciaBebe)}
          dica="Gestação: data provável do parto. Puerpério: data em que o bebê nasceu."
        />
        <Texto rotulo="Valor por sessão (R$)" nome="valorSessao" valor={valor} modo="decimal" placeholder="150,00" />
        <Texto rotulo="Como conheceu o trabalho" nome="comoConheceu" valor={p.comoConheceu} className="sm:col-span-2" />
      </Bloco>

      {clinico && (
        <fieldset className="cartao p-4 sm:p-5">
          <h2 className="font-serif text-xl text-cacau">Informações clínicas iniciais</h2>
          <p className="mb-4 mt-1 text-xs text-stone-500">🔒 Gravadas de forma criptografada. Só a psicóloga vê.</p>
          <div className="grid gap-4">
            <AreaTexto rotulo="Queixa inicial / demanda" nome="queixa" valor={p.queixa} linhas={5} />
            <AreaTexto rotulo="Observações gerais" nome="observacoes" valor={p.observacoes} linhas={4} />
          </div>
        </fieldset>
      )}

      <div className="cartao p-4 sm:p-5">
        <Caixa rotulo="Paciente (ou responsável) consentiu com o tratamento dos dados (LGPD) e com o contrato terapêutico" nome="consentimentoLgpd" marcado={!!p.consentimentoLgpdEm} />
      </div>

      <div className="flex flex-wrap gap-3">
        <BotaoEnviar>{id ? 'Salvar alterações' : 'Cadastrar paciente'}</BotaoEnviar>
      </div>
    </Formulario>
  )
}
