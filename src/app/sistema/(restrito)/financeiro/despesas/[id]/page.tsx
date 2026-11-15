import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirFinanceiro } from '@/lib/auth'
import { dataParaCampo } from '@/lib/formatos'
import { CATEGORIAS_DESPESA, FORMAS_PAGAMENTO, opcoes } from '@/lib/rotulos'
import { Cabecalho, Cartao, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { alterarDespesa, excluirDespesa } from '../../actions'

export default async function EditarDespesa({ params }: { params: Promise<{ id: string }> }) {
  await exigirFinanceiro()
  const { id } = await params
  const d = await db.despesa.findUnique({ where: { id } })
  if (!d) notFound()
  const mes = d.vencimento.toISOString().slice(0, 7)

  return (
    <div className="mx-auto max-w-xl">
      <Cabecalho titulo={d.descricao} acoes={<LinkBotao href={`/sistema/financeiro/despesas?mes=${mes}`}>Voltar</LinkBotao>} />
      <Cartao>
        <Formulario action={alterarDespesa.bind(null, d.id)} className="grid gap-4 sm:grid-cols-2">
          <Texto rotulo="Descrição" nome="descricao" valor={d.descricao} obrigatorio className="sm:col-span-2" />
          <Selecao rotulo="Categoria" nome="categoria" valor={d.categoria} opcoes={opcoes(CATEGORIAS_DESPESA)} />
          <Texto rotulo="Valor (R$)" nome="valor" modo="decimal" obrigatorio valor={(d.valorCentavos / 100).toFixed(2).replace('.', ',')} />
          <Texto rotulo="Vencimento" nome="vencimento" tipo="date" obrigatorio valor={dataParaCampo(d.vencimento)} />
          <Texto rotulo="Paga em (vazio = em aberto)" nome="pagoEm" tipo="date" valor={dataParaCampo(d.pagoEm)} />
          <Selecao rotulo="Forma de pagamento" nome="forma" valor={d.forma} vazio="—" opcoes={opcoes(FORMAS_PAGAMENTO)} />
          <Texto rotulo="Observação" nome="observacao" valor={d.observacao} maximo={300} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <BotaoEnviar>Salvar</BotaoEnviar>
          </div>
        </Formulario>
        {!d.pagoEm && (
          <Formulario action={excluirDespesa.bind(null, d.id)} className="mt-5 space-y-3 border-t border-stone-100 pt-4">
            {d.serieId && <Caixa rotulo="Excluir também as próximas desta série mensal (em aberto)" nome="proximas" />}
            <BotaoEnviar variante="perigo" confirmar="Excluir esta despesa em aberto?">
              Excluir despesa
            </BotaoEnviar>
          </Formulario>
        )}
      </Cartao>
    </div>
  )
}
