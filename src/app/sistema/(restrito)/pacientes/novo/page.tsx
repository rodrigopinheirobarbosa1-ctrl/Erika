import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { descriptografar } from '@/lib/cripto'
import { lerData } from '@/lib/formatos'
import { paraCadastro, type Respostas } from '@/lib/anamnese/respostas'
import { Cabecalho, Aviso, LinkBotao } from '@/components/ui'
import { FormularioPaciente, type DadosFormulario } from '../formulario'

export default async function NovoPaciente({ searchParams }: { searchParams: Promise<{ pre?: string; ficha?: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const clinico = podeVerClinico(usuario)
  const { pre, ficha } = await searchParams
  let inicial: DadosFormulario = {}
  let aviso: string | null = null

  // Vindo de um pedido de contato: já traz o que a pessoa preencheu no site.
  if (pre) {
    const p = await db.preCadastro.findUnique({ where: { id: pre } })
    if (p && !p.pacienteId) {
      inicial = {
        nome: p.nome,
        telefone: p.telefone,
        email: p.email,
        modalidade: p.modalidade,
        area: p.area,
        queixa: clinico ? descriptografar(p.motivoCripto) : null,
        comoConheceu: 'Site',
        preCadastroId: p.id,
        inicioAtendimento: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z'),
      }
      aviso = `Dados trazidos do pedido de contato de ${p.nome}. Complete e salve.`

      // Com a ficha de anamnese respondida: o cadastro sai das respostas.
      const f = ficha ? await db.fichaAnamnese.findFirst({ where: { id: ficha, preCadastroId: p.id, status: 'RESPONDIDA' } }) : null
      if (f?.respostasCripto) {
        const c = paraCadastro(JSON.parse(descriptografar(f.respostasCripto)!) as Respostas)
        inicial = {
          ...inicial,
          nome: c.nome ?? inicial.nome,
          telefone: c.telefone ?? inicial.telefone,
          email: c.email ?? inicial.email,
          dataNascimento: c.dataNascimento ? (lerData(c.dataNascimento) ?? null) : null,
          estadoCivil: c.estadoCivil,
          profissao: c.profissao,
          cpf: c.cpf,
          endereco: c.endereco,
          cidade: c.cidade,
          contatoEmergencia: c.contatoEmergencia,
          telefoneEmergencia: c.telefoneEmergencia,
          ...(clinico && c.motivo ? { queixa: c.motivo } : {}),
          consentimentoLgpdEm: f.consentimentoEm,
        }
        aviso = `Dados trazidos da ficha de anamnese que ${p.nome} respondeu. Confira e salve — a ficha completa fica no prontuário.`
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Novo paciente" acoes={<LinkBotao href="/sistema/pacientes">Voltar</LinkBotao>} />
      {aviso && (
        <div className="mb-5">
          <Aviso>{aviso}</Aviso>
        </div>
      )}
      <FormularioPaciente id={null} p={inicial} clinico={clinico} />
    </div>
  )
}
