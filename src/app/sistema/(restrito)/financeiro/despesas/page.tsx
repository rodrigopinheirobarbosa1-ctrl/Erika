import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirFinanceiro } from '@/lib/auth'
import { formatarData, formatarReais, lerData } from '@/lib/formatos'
import { limitesDoMes, mesValido, rotuloMes, somarMeses } from '@/lib/financeiro'
import { hojeLocal } from '@/lib/horario'
import { CATEGORIAS_DESPESA, opcoes } from '@/lib/rotulos'
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Vazio } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { criarDespesa, pagarDespesa } from '../actions'

export default async function Despesas({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirFinanceiro()
  const { mes: m } = await searchParams
  const hoje = hojeLocal()
  const mes = mesValido(m) ? m : hoje.slice(0, 7)
  const { inicio, fim } = limitesDoMes(mes)
  const diaHoje = lerData(hoje)!

  const [doMes, atrasadas] = await Promise.all([
    db.despesa.findMany({ where: { vencimento: { gte: lerData(inicio)!, lt: lerData(fim)! } }, orderBy: [{ vencimento: 'asc' }, { descricao: 'asc' }] }),
    db.despesa.findMany({ where: { pagoEm: null, vencimento: { lt: lerData(inicio)! } }, orderBy: { vencimento: 'asc' } }),
  ])
  const total = doMes.reduce((t, d) => t + d.valorCentavos, 0)
  const pago = doMes.filter((d) => d.pagoEm).reduce((t, d) => t + d.valorCentavos, 0)

  const Linha = ({ d }: { d: (typeof doMes)[number] }) => {
    const vencida = !d.pagoEm && d.vencimento < diaHoje
    return (
      <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/sistema/financeiro/despesas/${d.id}`} className="min-w-0 hover:underline sm:flex-1">
          <span className="block text-stone-800">{d.descricao}</span>
          <span className="block text-xs text-stone-500">
            {CATEGORIAS_DESPESA[d.categoria]} · vence {formatarData(d.vencimento)}
            {d.serieId && ' · mensal'}
          </span>
        </Link>
        <span className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="font-medium tabular-nums">{formatarReais(d.valorCentavos)}</span>
          {d.pagoEm ? (
            <Etiqueta tom="verde">Paga {formatarData(d.pagoEm).slice(0, 5)}</Etiqueta>
          ) : (
            <Etiqueta tom={vencida ? 'vermelho' : 'amarelo'}>{vencida ? 'Vencida' : 'Em aberto'}</Etiqueta>
          )}
          <Formulario action={pagarDespesa.bind(null, d.id)}>
            {d.pagoEm ? <input type="hidden" name="desfazer" value="sim" /> : <input type="hidden" name="forma" value="PIX" />}
            <BotaoEnviar variante="secundario">{d.pagoEm ? 'Desfazer' : 'Paga hoje'}</BotaoEnviar>
          </Formulario>
        </span>
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Despesas" descricao={`${rotuloMes(mes)} · ${formatarReais(pago)} pagos de ${formatarReais(total)}`} acoes={<LinkBotao href={`/sistema/financeiro?mes=${mes}`}>Resumo</LinkBotao>} />
      <div className="mb-4 flex gap-2">
        <LinkBotao href={`/sistema/financeiro/despesas?mes=${somarMeses(mes, -1)}`}>← Anterior</LinkBotao>
        <LinkBotao href="/sistema/financeiro/despesas">Este mês</LinkBotao>
        <LinkBotao href={`/sistema/financeiro/despesas?mes=${somarMeses(mes, 1)}`}>Próximo →</LinkBotao>
      </div>

      <div className="space-y-5">
        {atrasadas.length > 0 && (
          <Cartao titulo="Vencidas de meses anteriores">
            <ul className="-my-3 divide-y divide-stone-100">{atrasadas.map((d) => <Linha key={d.id} d={d} />)}</ul>
          </Cartao>
        )}
        <Cartao titulo={`Vencimentos de ${rotuloMes(mes)}`}>
          {doMes.length === 0 ? <Vazio texto="Nenhuma despesa neste mês." /> : <ul className="-my-3 divide-y divide-stone-100">{doMes.map((d) => <Linha key={d.id} d={d} />)}</ul>}
        </Cartao>

        <Cartao titulo="Nova despesa">
          <Formulario action={criarDespesa} limparAoSalvar className="grid gap-4 sm:grid-cols-2">
            <Texto rotulo="Descrição" nome="descricao" obrigatorio placeholder="Ex.: aluguel da sala" className="sm:col-span-2" />
            <Selecao rotulo="Categoria" nome="categoria" valor="SALA" opcoes={opcoes(CATEGORIAS_DESPESA)} />
            <Texto rotulo="Valor (R$)" nome="valor" modo="decimal" obrigatorio />
            <Texto rotulo="Vencimento" nome="vencimento" tipo="date" obrigatorio valor={`${mes}-${hoje.slice(8, 10) > '28' ? '28' : hoje.slice(8, 10)}`} />
            <Selecao
              rotulo="Repetir todo mês"
              nome="repetirMeses"
              valor="0"
              opcoes={[{ valor: '0', texto: 'Não repetir' }, ...[2, 5, 11, 23].map((n) => ({ valor: String(n), texto: `Por mais ${n} meses (${n + 1} no total)` }))]}
            />
            <Texto rotulo="Observação" nome="observacao" maximo={300} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Caixa rotulo="Já está paga (a primeira)" nome="jaPaga" />
            </div>
            <div className="sm:col-span-2">
              <BotaoEnviar>Lançar despesa</BotaoEnviar>
            </div>
          </Formulario>
        </Cartao>
      </div>
    </div>
  )
}
