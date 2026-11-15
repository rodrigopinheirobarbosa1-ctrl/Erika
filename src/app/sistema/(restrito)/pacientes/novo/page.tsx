import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { descriptografar } from '@/lib/cripto'
import { Cabecalho, Aviso, LinkBotao } from '@/components/ui'
import { FormularioPaciente, type DadosFormulario } from '../formulario'

export default async function NovoPaciente({ searchParams }: { searchParams: Promise<{ pre?: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const clinico = podeVerClinico(usuario)
  const { pre } = await searchParams
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
