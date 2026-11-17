import { exigirFinanceiro } from '@/lib/auth'
import { formatarCpf, formatarData, formatarReais } from '@/lib/formatos'
import { mesValido, rotuloMes, somarMeses } from '@/lib/financeiro'
import { hojeLocal } from '@/lib/horario'
import { MOTIVOS_SEM_RECIBO, pendencias } from '@/lib/receita-saude'
import { pagamentosSemRecibo, profissional, recibosDispensados } from '@/lib/receita-saude-servidor'
import { Cabecalho, Cartao, LinkBotao, Vazio } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Texto } from '@/components/campos'
import { desfazerDispensa, dispensarRecibo, salvarDadosRecibo } from './actions'
import { Selecao } from '@/components/campos'
import { SelecaoRecibos, type ItemTela } from './selecao'

export default async function ReceitaSaude({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirFinanceiro()
  const { mes: m } = await searchParams
  const mes = mesValido(m) ? m : hojeLocal().slice(0, 7)
  const [prof, lista, dispensados] = await Promise.all([profissional(), pagamentosSemRecibo(mes), recibosDispensados(mes)])
  const itens: ItemTela[] = lista.map(({ item, pagamento: p }) => ({
    id: p.id,
    data: formatarData(p.data),
    paciente: p.paciente.nome,
    pacienteId: p.paciente.id,
    valor: formatarReais(p.valorCentavos),
    centavos: p.valorCentavos,
    pendencias: pendencias(item),
  }))

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Recibos — Receita Saúde" descricao={`${rotuloMes(mes)} · emissão em lote pelo Carnê-Leão`} acoes={<LinkBotao href={`/sistema/financeiro?mes=${mes}`}>Financeiro</LinkBotao>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <LinkBotao href={`/sistema/financeiro/receita-saude?mes=${somarMeses(mes, -1)}`}>← Mês anterior</LinkBotao>
        <LinkBotao href="/sistema/financeiro/receita-saude">Este mês</LinkBotao>
        <LinkBotao href={`/sistema/financeiro/receita-saude?mes=${somarMeses(mes, 1)}`}>Próximo →</LinkBotao>
      </div>

      <div className="space-y-5">
        <Cartao titulo="1. Dados da profissional (uma vez só)">
          <Formulario action={salvarDadosRecibo} className="grid gap-3 sm:grid-cols-2">
            <Texto rotulo="CPF da Érika" nome="cpf" modo="numeric" valor={prof.cpf ? formatarCpf(prof.cpf) : ''} obrigatorio dica="O mesmo CPF com que ela entra no Carnê-Leão. Fica só no banco (não vai para o código)." />
            <Texto rotulo="Registro profissional (opcional)" nome="registro" valor={prof.registro ?? ''} maximo={15} dica="Pode ficar vazio se ela tem um único CRP ativo." />
            <div className="sm:col-span-2">
              <BotaoEnviar variante={prof.cpf ? 'secundario' : 'primario'}>Salvar</BotaoEnviar>
            </div>
          </Formulario>
        </Cartao>

        <Cartao titulo={`2. Escolha os pagamentos de ${rotuloMes(mes)}`}>
          {itens.length === 0 ? (
            <Vazio texto="Nenhum pagamento sem recibo neste mês. 🌿" />
          ) : (
            <>
              <p className="mb-3 text-xs text-stone-500">Cada recibo corresponde a um pagamento recebido (data e valor pagos), como pede a Receita. Todos vêm marcados; desmarque o que não quer emitir agora.</p>
              <SelecaoRecibos itens={itens} mes={mes} temCpf={!!prof.cpf} />
              <details className="mt-5 border-t border-stone-100 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-marca-700">Algum destes não terá recibo? (cortesia, pago por empresa…)</summary>
                <ul className="mt-2 divide-y divide-stone-100">
                  {itens.map((i) => (
                    <li key={i.id} className="py-3">
                      <p className="text-sm">
                        {i.data} · {i.paciente} · {i.valor}
                      </p>
                      <Formulario action={dispensarRecibo.bind(null, i.id)} className="mt-2 flex flex-wrap items-end gap-2">
                        <Selecao rotulo="Motivo" nome="motivo" valor={MOTIVOS_SEM_RECIBO[0]} opcoes={MOTIVOS_SEM_RECIBO.map((m) => ({ valor: m, texto: m }))} />
                        <label className="block">
                          <span className="rotulo">Detalhe (se “Outro”)</span>
                          <input name="detalhe" maxLength={150} className="campo" />
                        </label>
                        <BotaoEnviar variante="secundario">Não emitir recibo</BotaoEnviar>
                      </Formulario>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </Cartao>

        {dispensados.length > 0 && (
          <Cartao titulo={`Sem recibo neste mês (${dispensados.length})`}>
            <ul className="-my-2 divide-y divide-stone-100 text-sm">
              {dispensados.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {formatarData(p.data)} · {p.paciente.nome} · {formatarReais(p.valorCentavos)}
                    <span className="block text-xs text-stone-500">{p.reciboDispensadoMotivo}</span>
                  </span>
                  <Formulario action={desfazerDispensa.bind(null, p.id)}>
                    <BotaoEnviar variante="secundario">Desfazer</BotaoEnviar>
                  </Formulario>
                </li>
              ))}
            </ul>
          </Cartao>
        )}

        <Cartao titulo="3. Importar no e-CAC">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
            <li>Baixe o arquivo no passo 2 (só com os selecionados).</li>
            <li>
              Entre no <strong>e-CAC</strong> (cav.receita.fazenda.gov.br) com o gov.br da Érika e abra o <strong>Carnê-Leão</strong>.
            </li>
            <li>
              No menu lateral, <strong>Escrituração → Importar Escrituração</strong> e escolha o arquivo.
            </li>
            <li>
              Toque em <strong>Analisar Arquivo</strong>. Se aparecer erro, ele indica a linha — corrija aqui e baixe de novo.
            </li>
            <li>
              Toque em <strong>Importar</strong>: os recibos são emitidos e aparecem no app Receita Saúde.
            </li>
            <li>
              Volte aqui e toque em <strong>“Marcar como emitidos”</strong> (com a mesma seleção).
            </li>
          </ol>
          <p className="mt-3 text-xs text-stone-500">
            Errou? No e-CAC, “Histórico da Escrituração” → <strong>Desfazer escrituração</strong> cancela o lote. A Receita exige recibo de todo pagamento de pessoa física,
            emitido no momento do pagamento — os que ficarem desmarcados continuam nesta lista.
          </p>
        </Cartao>
      </div>
    </div>
  )
}
