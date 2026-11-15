import type { Prisma, StatusPaciente } from '@prisma/client'
import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { formatarTelefone, idade } from '@/lib/formatos'
import { AREAS, STATUS_PACIENTE } from '@/lib/rotulos'
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Vazio } from '@/components/ui'

const TOM: Record<StatusPaciente, 'verde' | 'amarelo' | 'cinza' | 'azul'> = { ATIVO: 'verde', PAUSADO: 'amarelo', ALTA: 'azul', INATIVO: 'cinza' }

export default async function Pacientes({ searchParams }: { searchParams: Promise<{ busca?: string; situacao?: string }> }) {
  await exigirUsuario()
  const { busca = '', situacao = 'ATIVO' } = await searchParams
  const filtro: Prisma.PacienteWhereInput = {}
  if (situacao !== 'TODOS' && situacao in STATUS_PACIENTE) filtro.status = situacao as StatusPaciente
  if (busca.trim()) {
    const digitos = busca.replace(/\D/g, '')
    filtro.OR = [
      { nome: { contains: busca.trim(), mode: 'insensitive' } },
      { nomeSocial: { contains: busca.trim(), mode: 'insensitive' } },
      ...(digitos.length >= 3 ? [{ telefone: { contains: digitos } }, { cpf: { contains: digitos } }] : []),
    ]
  }
  const pacientes = await db.paciente.findMany({ where: filtro, orderBy: { nome: 'asc' }, take: 300 })

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho titulo="Pacientes" acoes={<LinkBotao href="/sistema/pacientes/novo" variante="primario">+ Novo paciente</LinkBotao>} />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input name="busca" defaultValue={busca} placeholder="Buscar por nome, telefone ou CPF" className="campo sm:flex-1" type="search" />
        <select name="situacao" defaultValue={situacao} className="campo sm:w-48">
          {Object.entries(STATUS_PACIENTE).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
          <option value="TODOS">Todos</option>
        </select>
        <button className="btn-secundario">Filtrar</button>
      </form>

      <Cartao>
        {pacientes.length === 0 ? (
          <Vazio texto="Nenhum paciente encontrado." acao={<LinkBotao href="/sistema/pacientes/novo">Cadastrar paciente</LinkBotao>} />
        ) : (
          <ul className="-my-2 divide-y divide-stone-100">
            {pacientes.map((p) => (
              <li key={p.id}>
                <Link href={`/sistema/pacientes/${p.id}`} className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-3 hover:bg-marca-50">
                  <span>
                    <span className="block font-medium text-stone-800">
                      {p.nomeSocial || p.nome}
                      {p.dataNascimento && <span className="ml-2 text-sm font-normal text-stone-400">{idade(p.dataNascimento)} anos</span>}
                    </span>
                    <span className="block text-sm text-stone-500">
                      {[formatarTelefone(p.telefone), p.area && AREAS[p.area]].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                  <Etiqueta tom={TOM[p.status]}>{STATUS_PACIENTE[p.status]}</Etiqueta>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
