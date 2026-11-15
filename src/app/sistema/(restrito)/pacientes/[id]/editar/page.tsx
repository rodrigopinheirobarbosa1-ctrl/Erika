import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { descriptografar } from '@/lib/cripto'
import { Cabecalho, LinkBotao } from '@/components/ui'
import { FormularioPaciente } from '../../formulario'

export default async function EditarPaciente({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario()
  const { id } = await params
  const p = await db.paciente.findUnique({ where: { id } })
  if (!p) notFound()
  const { queixaCripto, observacoesCripto, ...resto } = p

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo={`Editar: ${p.nome}`} acoes={<LinkBotao href={`/sistema/pacientes/${id}`}>Cancelar</LinkBotao>} />
      <FormularioPaciente id={id} p={{ ...resto, queixa: descriptografar(queixaCripto), observacoes: descriptografar(observacoesCripto) }} />
    </div>
  )
}
