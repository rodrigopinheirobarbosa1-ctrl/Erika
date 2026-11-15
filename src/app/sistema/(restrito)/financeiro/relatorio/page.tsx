import { db } from '@/lib/db'
import { exigirFinanceiro } from '@/lib/auth'
import { formatarCpf, formatarData, formatarDataHora, formatarReais, lerData } from '@/lib/formatos'
import { limitesDoMes, mesValido, rotuloMes, somarMeses } from '@/lib/financeiro'
import { hojeLocal } from '@/lib/horario'
import { site } from '@/lib/site'
import { CATEGORIAS_DESPESA, FORMAS_PAGAMENTO } from '@/lib/rotulos'
import { BotaoImprimir } from '@/components/botao-imprimir'
import { BotaoEnviar, Formulario } from '@/components/form'
import { LinkBotao, Tabela, Td, Th } from '@/components/ui'
import { marcarRecibo } from '../actions'

/** Recebimentos do mês (com CPF de quem pagou) e livro-caixa, para o carnê-leão. */
export default async function Relatorio({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirFinanceiro()
  const { mes: m } = await searchParams
  const mes = mesValido(m) ? m : hojeLocal().slice(0, 7)
  const { inicio, fim } = limitesDoMes(mes)
  const di = lerData(inicio)!, df = lerData(fim)!

  const [pagamentos, despesas] = await Promise.all([
    db.pagamento.findMany({
      where: { estornadoEm: null, data: { gte: di, lt: df } },
      orderBy: [{ data: 'asc' }, { criadoEm: 'asc' }],
      include: { paciente: { select: { nome: true, cpf: true, responsavelNome: true, responsavelCpf: true } } },
    }),
    db.despesa.findMany({ where: { pagoEm: { gte: di, lt: df } }, orderBy: { pagoEm: 'asc' } }),
  ])
  const totalRecebido = pagamentos.reduce((t, p) => t + p.valorCentavos, 0)
  const totalDespesas = despesas.reduce((t, d) => t + d.valorCentavos, 0)
  const pendentes = pagamentos.filter((p) => !p.reciboEmitido).length

  return (
    <div className="mx-auto max-w-4xl bg-white p-4 text-stone-900 sm:p-6 print:p-0">
      <div className="mb-5 flex flex-wrap gap-2 nao-imprimir">
        <LinkBotao href={`/sistema/financeiro?mes=${mes}`}>← Financeiro</LinkBotao>
        <LinkBotao href={`/sistema/financeiro/relatorio?mes=${somarMeses(mes, -1)}`}>Mês anterior</LinkBotao>
        <LinkBotao href={`/sistema/financeiro/relatorio?mes=${somarMeses(mes, 1)}`}>Próximo</LinkBotao>
        <BotaoImprimir />
      </div>
      <header className="border-b border-stone-300 pb-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {site.nomeCompleto} · {site.profissao} · {site.crp}
        </p>
        <h1 className="mt-1 font-serif text-3xl">Recebimentos e despesas — {rotuloMes(mes)}</h1>
        <p className="text-xs text-stone-500">Emitido em {formatarDataHora(new Date())}. Apoio para o carnê-leão; confira antes de declarar.</p>
      </header>

      <h2 className="mt-6 font-serif text-xl">Recebimentos: {formatarReais(totalRecebido)}</h2>
      {pendentes > 0 && <p className="mt-1 text-sm text-amber-800 nao-imprimir">{pendentes} sem recibo marcado como emitido no Receita Saúde.</p>}
      <Tabela className="mt-2">
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Paciente (beneficiário)</Th>
            <Th>Quem pagou / CPF</Th>
            <Th>Forma</Th>
            <Th alinhar="direita">Valor</Th>
            <Th>Recibo</Th>
          </tr>
        </thead>
        <tbody>
          {pagamentos.map((p) => {
            const nome = p.pagadorNome || p.paciente.responsavelNome || p.paciente.nome
            const cpf = p.pagadorCpf || (p.pagadorNome ? null : p.paciente.responsavelCpf || p.paciente.cpf)
            return (
              <tr key={p.id}>
                <Td className="whitespace-nowrap">{formatarData(p.data)}</Td>
                <Td>
                  {p.paciente.nome}
                  {p.paciente.cpf && <span className="block text-xs text-stone-500">CPF {formatarCpf(p.paciente.cpf)}</span>}
                </Td>
                <Td>
                  {nome}
                  <span className={`block text-xs ${cpf ? 'text-stone-500' : 'text-red-700'}`}>{cpf ? `CPF ${formatarCpf(cpf)}` : 'CPF não cadastrado'}</span>
                </Td>
                <Td>{FORMAS_PAGAMENTO[p.forma]}</Td>
                <Td alinhar="direita">{formatarReais(p.valorCentavos)}</Td>
                <Td>
                  <span className="print:inline hidden">{p.reciboEmitido ? 'emitido' : 'pendente'}</span>
                  <Formulario action={marcarRecibo.bind(null, p.id)} className="nao-imprimir">
                    <input type="hidden" name="emitido" value={p.reciboEmitido ? 'nao' : 'sim'} />
                    <BotaoEnviar variante={p.reciboEmitido ? 'secundario' : 'primario'}>{p.reciboEmitido ? '✓ emitido' : 'Marcar emitido'}</BotaoEnviar>
                  </Formulario>
                </Td>
              </tr>
            )
          })}
          {pagamentos.length === 0 && (
            <tr>
              <Td className="text-stone-500">Nenhum recebimento no mês.</Td>
            </tr>
          )}
        </tbody>
      </Tabela>

      <h2 className="mt-8 font-serif text-xl">Despesas pagas (livro-caixa): {formatarReais(totalDespesas)}</h2>
      <Tabela className="mt-2">
        <thead>
          <tr>
            <Th>Pago em</Th>
            <Th>Descrição</Th>
            <Th>Categoria</Th>
            <Th alinhar="direita">Valor</Th>
          </tr>
        </thead>
        <tbody>
          {despesas.map((d) => (
            <tr key={d.id}>
              <Td className="whitespace-nowrap">{formatarData(d.pagoEm)}</Td>
              <Td>{d.descricao}</Td>
              <Td>{CATEGORIAS_DESPESA[d.categoria]}</Td>
              <Td alinhar="direita">{formatarReais(d.valorCentavos)}</Td>
            </tr>
          ))}
          {despesas.length === 0 && (
            <tr>
              <Td className="text-stone-500">Nenhuma despesa paga no mês.</Td>
            </tr>
          )}
        </tbody>
      </Tabela>
      <p className="mt-6 text-sm">
        <strong>Recebido − despesas pagas: {formatarReais(totalRecebido - totalDespesas)}</strong>
      </p>
      <p className="mt-2 text-xs text-stone-500">Nem toda despesa é dedutível no livro-caixa; na dúvida, confirme com o contador.</p>
    </div>
  )
}
