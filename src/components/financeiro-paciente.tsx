import type { Atendimento, Pagamento } from '@prisma/client'
import Link from '@/components/link'
import { extrato, resumoConta } from '@/lib/financeiro'
import { formatarData, formatarReais } from '@/lib/formatos'
import { rotuloInstante } from '@/lib/horario'
import { FORMAS_PAGAMENTO } from '@/lib/rotulos'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Aviso, Cartao, Etiqueta, LinkBotao } from '@/components/ui'
import { corrigirObservacao, estornarPagamento, marcarRecibo } from '@/app/sistema/(restrito)/financeiro/actions'

/** Conta corrente do paciente: saldo, extrato e pagamentos. */
export function FinanceiroPaciente({
  pacienteId,
  sessoes,
  pagamentos,
  aviso,
}: {
  aviso?: string
  pacienteId: string
  sessoes: Pick<Atendimento, 'id' | 'inicio' | 'status' | 'valorCentavos' | 'cobrarFalta'>[]
  pagamentos: Pagamento[]
}) {
  const r = resumoConta(sessoes, pagamentos)
  const linhas = extrato(sessoes, pagamentos).reverse().slice(0, 15)

  return (
    <Cartao
      titulo="Financeiro"
      className="lg:col-span-2 scroll-mt-20"
      acao={<LinkBotao href={`/sistema/financeiro/pagamento?paciente=${pacienteId}`}>+ Pagamento</LinkBotao>}
    >
      {aviso === 'estornado' && (
        <div className="mb-4">
          <Aviso tom="verde">
            Pagamento estornado: continua no histórico (riscado), mas deixou de contar. Se foi lançado errado, registre de novo em{' '}
            <Link href={`/sistema/financeiro/pagamento?paciente=${pacienteId}`} className="underline">+ Pagamento</Link>.
          </Aviso>
        </div>
      )}
      {aviso?.startsWith('corrigido') && (
        <div className="mb-4">
          <Aviso tom={aviso === 'corrigido' ? 'verde' : 'amarelo'}>
            {aviso === 'corrigido'
              ? 'Observação corrigida. O recibo vai sair com o texto novo.'
              : 'Observação corrigida no sistema. O recibo já emitido na Receita não muda — se precisar, cancele e emita de novo no Receita Saúde.'}
          </Aviso>
        </div>
      )}
      <div id="financeiro" className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="rotulo">Sessões cobradas</p>
          <p className="tabular-nums">{formatarReais(r.devido)}</p>
        </div>
        <div>
          <p className="rotulo">Pago</p>
          <p className="tabular-nums">{formatarReais(r.pago)}</p>
        </div>
        <div>
          <p className="rotulo">{r.saldo < 0 ? 'Crédito' : 'Em aberto'}</p>
          <p className={`text-lg font-semibold tabular-nums ${r.saldo > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatarReais(Math.abs(r.saldo))}</p>
        </div>
      </div>
      {r.semValor > 0 && <p className="mt-2 text-xs text-amber-800">{r.semValor} sessão(ões) realizada(s) sem valor definido — abra a sessão e informe o valor.</p>}

      <p className="rotulo mt-5">Extrato (mais recentes primeiro)</p>
      {linhas.length === 0 ? (
        <p className="text-sm text-stone-400">Nada ainda.</p>
      ) : (
        <ul className="divide-y divide-stone-100 text-sm">
          {linhas.map((l) => (
            <li key={l.tipo + l.id} className="flex items-center justify-between gap-2 py-2">
              <span>
                {l.tipo === 'SESSAO' ? (
                  <Link href={`/sistema/agenda/${l.id}`} className="hover:underline">
                    {l.falta ? 'Falta cobrada' : 'Sessão'} · {rotuloInstante(l.data)}
                    {l.semValor && <span className="text-amber-700"> (sem valor)</span>}
                  </Link>
                ) : (
                  <>Pagamento · {formatarData(l.data)}</>
                )}
              </span>
              <span className="text-right tabular-nums">
                <span className={l.valorCentavos < 0 ? 'text-emerald-700' : ''}>{l.valorCentavos < 0 ? `− ${formatarReais(-l.valorCentavos)}` : formatarReais(l.valorCentavos)}</span>
                <span className="block text-xs text-stone-400">saldo {formatarReais(l.saldoCentavos)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {pagamentos.length > 0 && (
        <details className="mt-4" open={!!aviso}>
          <summary className="cursor-pointer text-sm font-medium text-marca-700">Pagamentos ({pagamentos.length}) — recibo, correção e estorno</summary>
          <ul className="mt-2 divide-y divide-stone-100 text-sm">
            {pagamentos.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={p.estornadoEm ? 'text-stone-400 line-through' : ''}>
                    {formatarData(p.data)} · {FORMAS_PAGAMENTO[p.forma]} · {formatarReais(p.valorCentavos)}
                    {p.pagadorNome && <span className="text-stone-500"> · pago por {p.pagadorNome}</span>}
                  </span>
                  {p.estornadoEm ? (
                    <Etiqueta tom="cinza">Estornado</Etiqueta>
                  ) : p.reciboDispensadoMotivo && !p.reciboEmitido ? (
                    <Etiqueta tom="cinza">Sem recibo: {p.reciboDispensadoMotivo}</Etiqueta>
                  ) : (
                    <Formulario action={marcarRecibo.bind(null, p.id)}>
                      <input type="hidden" name="emitido" value={p.reciboEmitido ? 'nao' : 'sim'} />
                      <BotaoEnviar variante="secundario">{p.reciboEmitido ? '✓ Recibo emitido' : 'Marcar recibo emitido'}</BotaoEnviar>
                    </Formulario>
                  )}
                </div>
                {p.observacao && <p className="text-xs text-stone-500">{p.observacao}</p>}
                {!p.estornadoEm && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-marca-700">Corrigir observação (descrição do recibo)</summary>
                    <Formulario action={corrigirObservacao.bind(null, p.id)} className="mt-2 flex flex-wrap items-end gap-2">
                      <label className="block flex-1">
                        <span className="rotulo">Observação</span>
                        <input name="observacao" defaultValue={p.observacao ?? ''} maxLength={230} className="campo" />
                      </label>
                      <BotaoEnviar variante="secundario">Salvar correção</BotaoEnviar>
                    </Formulario>
                  </details>
                )}
                {p.estornadoEm ? (
                  <p className="text-xs text-stone-500">Motivo do estorno: {p.estornoMotivo}</p>
                ) : (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-red-700">Estornar (valor, data ou paciente errado)</summary>
                    <Formulario action={estornarPagamento.bind(null, p.id)} className="mt-2 flex flex-wrap items-end gap-2">
                      <label className="block flex-1">
                        <span className="rotulo">Motivo</span>
                        <input name="motivo" required className="campo" placeholder="Ex.: valor digitado errado" />
                      </label>
                      <BotaoEnviar variante="perigo" confirmar="Estornar este pagamento? Ele continua no histórico, mas deixa de contar.">
                        Estornar
                      </BotaoEnviar>
                    </Formulario>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Cartao>
  )
}
