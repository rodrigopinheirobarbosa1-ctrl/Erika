import { redirect } from 'next/navigation'
import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirAcessoPacientes } from '@/lib/auth'
import { formatarData, formatarReais, lerData } from '@/lib/formatos'
import { cobravel, limitesDoMes, mesValido, rotuloMes, somarMeses } from '@/lib/financeiro'
import { hojeLocal, localParaUtc } from '@/lib/horario'
import { veFinanceiro } from '@/lib/permissoes'
import { saldosPorPaciente } from '@/lib/saldos'
import { CATEGORIAS_DESPESA } from '@/lib/rotulos'
import { Cabecalho, Cartao, Indicador, LinkBotao, Vazio } from '@/components/ui'

export default async function Financeiro({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const usuario = await exigirAcessoPacientes()
  if (!veFinanceiro(usuario.papel)) redirect('/sistema/financeiro/receber')
  const { mes: m } = await searchParams
  const hoje = hojeLocal()
  const mes = mesValido(m) ? m : hoje.slice(0, 7)
  const { inicio, fim } = limitesDoMes(mes)
  const di = lerData(inicio)!, df = lerData(fim)!

  const [recebidos, sessoes, pagas, previstas, vencidas, saldos, recibosPendentes] = await Promise.all([
    db.pagamento.aggregate({ where: { estornadoEm: null, data: { gte: di, lt: df } }, _sum: { valorCentavos: true }, _count: true }),
    db.atendimento.findMany({
      where: { inicio: { gte: localParaUtc(inicio, '00:00')!, lt: localParaUtc(fim, '00:00')! }, status: { in: ['REALIZADO', 'FALTOU'] } },
      select: { status: true, valorCentavos: true, cobrarFalta: true },
    }),
    db.despesa.findMany({ where: { pagoEm: { gte: di, lt: df } }, select: { categoria: true, valorCentavos: true } }),
    db.despesa.aggregate({ where: { vencimento: { gte: di, lt: df } }, _sum: { valorCentavos: true } }),
    db.despesa.findMany({ where: { pagoEm: null, vencimento: { lt: lerData(hoje)! } }, orderBy: { vencimento: 'asc' }, take: 8 }),
    saldosPorPaciente(),
    db.pagamento.count({ where: { estornadoEm: null, reciboEmitido: false } }),
  ])
  const recebido = recebidos._sum.valorCentavos ?? 0
  const faturado = sessoes.filter(cobravel).reduce((t, s) => t + (s.valorCentavos ?? 0), 0)
  const despesasPagas = pagas.reduce((t, d) => t + d.valorCentavos, 0)
  const aReceber = saldos.filter((s) => s.saldo > 0)
  const totalAReceber = aReceber.reduce((t, s) => t + s.saldo, 0)
  const porCategoria = Object.entries(
    pagas.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.categoria]: (acc[d.categoria] ?? 0) + d.valorCentavos }), {}),
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo="Financeiro"
        descricao={rotuloMes(mes)}
        acoes={
          <>
            <LinkBotao href="/sistema/financeiro/pagamento" variante="primario">
              + Pagamento recebido
            </LinkBotao>
            <LinkBotao href="/sistema/financeiro/despesas">Despesas</LinkBotao>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <LinkBotao href={`/sistema/financeiro?mes=${somarMeses(mes, -1)}`}>← Mês anterior</LinkBotao>
        <LinkBotao href="/sistema/financeiro">Este mês</LinkBotao>
        <LinkBotao href={`/sistema/financeiro?mes=${somarMeses(mes, 1)}`}>Próximo →</LinkBotao>
        <LinkBotao href={`/sistema/financeiro/relatorio?mes=${mes}`}>Relatório do mês (carnê-leão)</LinkBotao>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo="Recebido no mês" valor={formatarReais(recebido)} detalhe={`${recebidos._count} pagamento(s)`} />
        <Indicador titulo="Sessões cobradas no mês" valor={formatarReais(faturado)} detalhe="realizadas + faltas cobradas" />
        <Indicador titulo="Despesas pagas no mês" valor={formatarReais(despesasPagas)} detalhe={`previstas: ${formatarReais(previstas._sum.valorCentavos ?? 0)}`} />
        <Indicador titulo="Resultado do mês" valor={formatarReais(recebido - despesasPagas)} detalhe="recebido − despesas pagas" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Cartao titulo={`A receber hoje: ${formatarReais(totalAReceber)}`} acao={<Link href="/sistema/financeiro/receber" className="text-sm text-marca-700 hover:underline">Ver todos</Link>}>
          {aReceber.length === 0 ? (
            <Vazio texto="Ninguém com saldo em aberto. 🌿" />
          ) : (
            <ul className="-my-2 divide-y divide-stone-100">
              {aReceber.sort((a, b) => b.saldo - a.saldo).slice(0, 8).map((s) => (
                <li key={s.pacienteId}>
                  <Link href={`/sistema/pacientes/${s.pacienteId}#financeiro`} className="-mx-2 flex justify-between gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-marca-50">
                    <span>{s.nome}</span>
                    <span className="font-medium tabular-nums text-red-700">{formatarReais(s.saldo)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {recibosPendentes > 0 && (
            <p className="mt-3 text-xs text-amber-800">
              {recibosPendentes} pagamento(s) sem recibo marcado como emitido no Receita Saúde —{' '}
              <Link href={`/sistema/financeiro/relatorio?mes=${mes}`} className="underline">
                ver no relatório
              </Link>
              .
            </p>
          )}
        </Cartao>

        <Cartao titulo="Contas vencidas em aberto" acao={<Link href="/sistema/financeiro/despesas" className="text-sm text-marca-700 hover:underline">Despesas</Link>}>
          {vencidas.length === 0 ? (
            <Vazio texto="Nenhuma conta vencida." />
          ) : (
            <ul className="-my-2 divide-y divide-stone-100">
              {vencidas.map((d) => (
                <li key={d.id}>
                  <Link href={`/sistema/financeiro/despesas/${d.id}`} className="-mx-2 flex justify-between gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-marca-50">
                    <span>
                      {d.descricao} <span className="text-xs text-red-700">venceu {formatarData(d.vencimento)}</span>
                    </span>
                    <span className="tabular-nums">{formatarReais(d.valorCentavos)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {porCategoria.length > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-3">
              <p className="rotulo">Pagas no mês, por categoria</p>
              <ul className="space-y-1 text-sm">
                {porCategoria.map(([c, v]) => (
                  <li key={c} className="flex justify-between">
                    <span>{CATEGORIAS_DESPESA[c as keyof typeof CATEGORIAS_DESPESA]}</span>
                    <span className="tabular-nums">{formatarReais(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  )
}
