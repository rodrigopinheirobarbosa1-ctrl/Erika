import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirAcessoPacientes } from '@/lib/auth'
import { hojeLocal, localParaUtc, rotuloDia, segundaDaSemana, somarDias, utcParaLocal } from '@/lib/horario'
import { MODALIDADES_CURTAS, STATUS_ATENDIMENTO, TOM_ATENDIMENTO } from '@/lib/rotulos'
import { Cabecalho, Cartao, Etiqueta, LinkBotao } from '@/components/ui'
import { LembretesAgora } from '@/components/mensagens'

export default async function Agenda({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  await exigirAcessoPacientes()
  const { semana } = await searchParams
  const hoje = hojeLocal()
  const segunda = segundaDaSemana(semana && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? semana : hoje)
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(segunda, i))

  const atendimentos = await db.atendimento.findMany({
    where: { inicio: { gte: localParaUtc(segunda, '00:00')!, lt: localParaUtc(somarDias(segunda, 7), '00:00')! } },
    include: { paciente: { select: { nome: true, nomeSocial: true } } },
    orderBy: { inicio: 'asc' },
  })
  const porDia = (dia: string) => atendimentos.filter((a) => utcParaLocal(a.inicio).data === dia)
  const fmt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho
        titulo="Agenda"
        descricao={`Semana de ${fmt(segunda)} a ${fmt(somarDias(segunda, 6))}`}
        acoes={<LinkBotao href="/sistema/agenda/novo" variante="primario">+ Agendar</LinkBotao>}
      />
      <LembretesAgora />
      <div className="mb-4 flex gap-2">
        <LinkBotao href={`/sistema/agenda?semana=${somarDias(segunda, -7)}`}>← Anterior</LinkBotao>
        <LinkBotao href="/sistema/agenda">Hoje</LinkBotao>
        <LinkBotao href={`/sistema/agenda?semana=${somarDias(segunda, 7)}`}>Próxima →</LinkBotao>
      </div>

      <div className="space-y-3">
        {dias.map((dia) => {
          const lista = porDia(dia)
          const fimDeSemana = dia === dias[5] || dia === dias[6]
          if (fimDeSemana && lista.length === 0) return null
          return (
            <Cartao
              key={dia}
              titulo={rotuloDia(dia)}
              className={dia === hoje ? 'ring-2 ring-marca-300' : ''}
              acao={
                <Link href={`/sistema/agenda/novo?data=${dia}`} className="text-xs text-marca-700 hover:underline">
                  + agendar
                </Link>
              }
            >
              {lista.length === 0 ? (
                <p className="text-sm text-stone-400">Livre</p>
              ) : (
                <ul className="-my-2 divide-y divide-stone-100">
                  {lista.map((a) => {
                    const { hora } = utcParaLocal(a.inicio)
                    const cancelado = a.status === 'DESMARCADO_PACIENTE' || a.status === 'DESMARCADO_PSICOLOGA'
                    return (
                      <li key={a.id}>
                        <Link href={`/sistema/agenda/${a.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-marca-50">
                          <span className={`flex items-baseline gap-3 ${cancelado ? 'text-stone-400 line-through' : ''}`}>
                            <span className="w-12 font-semibold tabular-nums text-cacau">{hora}</span>
                            <span>
                              <span className="block text-stone-800">{a.paciente.nomeSocial || a.paciente.nome}</span>
                              <span className="block text-xs text-stone-500">
                                {MODALIDADES_CURTAS[a.modalidade]} · {a.duracaoMin} min
                              </span>
                            </span>
                          </span>
                          <Etiqueta tom={TOM_ATENDIMENTO[a.status]}>{STATUS_ATENDIMENTO[a.status]}</Etiqueta>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Cartao>
          )
        })}
      </div>
    </div>
  )
}
