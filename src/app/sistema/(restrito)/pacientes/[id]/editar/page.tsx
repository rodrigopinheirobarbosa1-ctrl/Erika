import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { descriptografar } from '@/lib/cripto'
import { Cabecalho, LinkBotao } from '@/components/ui'
import { FormularioPaciente } from '../../formulario'

export default async function EditarPaciente({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  const clinico = podeVerClinico(usuario)
  const { id } = await params
  const p = await db.paciente.findUnique({ where: { id } })
  if (!p) notFound()
  const { queixaCripto, observacoesCripto, ...resto } = p

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo={`Editar: ${p.nome}`} acoes={<LinkBotao href={`/sistema/pacientes/${id}`}>Cancelar</LinkBotao>} />
      <FormularioPaciente
        id={id}
        clinico={clinico}
        p={clinico ? { ...resto, queixa: descriptografar(queixaCripto), observacoes: descriptografar(observacoesCripto) } : resto}
      />
    </div>
  )
}
