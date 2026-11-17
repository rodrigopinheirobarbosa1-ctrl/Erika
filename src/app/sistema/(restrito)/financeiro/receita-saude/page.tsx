import Link from '@/components/link'
import { exigirFinanceiro } from '@/lib/auth'
import { formatarCpf, formatarData, formatarReais } from '@/lib/formatos'
import { mesValido, rotuloMes, somarMeses } from '@/lib/financeiro'
import { hojeLocal } from '@/lib/horario'
import { pendencias } from '@/lib/receita-saude'
import { pagamentosSemRecibo, profissional } from '@/lib/receita-saude-servidor'
import { Aviso, Cabecalho, Cartao, LinkBotao, Vazio } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Texto } from '@/components/campos'
import { marcarLoteEmitido, salvarDadosRecibo } from './actions'

export default async function ReceitaSaude({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirFinanceiro()
  const { mes: m } = await searchParams
  const mes = mesValido(m) ? m : hojeLocal().slice(0, 7)
  const [prof, lista] = await Promise.all([profissional(), pagamentosSemRecibo(mes)])
  const prontos = lista.filter((x) => pendencias(x.item).length === 0)
  const comPendencia = lista.filter((x) => pendencias(x.item).length > 0)
  const total = prontos.reduce((t, x) => t + x.item.valorCentavos, 0)

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

        <Cartao titulo={`2. Pagamentos de ${rotuloMes(mes)} sem recibo`}>
          {lista.length === 0 ? (
            <Vazio texto="Nenhum pagamento sem recibo neste mês. 🌿" />
          ) : (
            <>
              <p className="mb-2 text-sm text-stone-600">
                <strong>{prontos.length}</strong> pronto(s) para o arquivo ({formatarReais(total)}){comPendencia.length > 0 && <> · <strong className="text-amber-800">{comPendencia.length}</strong> com pendência</>}
              </p>
              <ul className="divide-y divide-stone-100 text-sm">
                {lista.map(({ item, pagamento: p }) => {
                  const falta = pendencias(item)
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        {formatarData(p.data)} · <Link href={`/sistema/pacientes/${p.paciente.id}#financeiro`} className="hover:underline">{p.paciente.nome}</Link>
                        {falta.length > 0 && (
                          <span className="block text-xs text-amber-800">
                            {falta.join(' · ')} — <Link href={`/sistema/pacientes/${p.paciente.id}/editar`} className="underline">completar cadastro</Link>
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums">{formatarReais(p.valorCentavos)}</span>
                    </li>
                  )
                })}
              </ul>
              {comPendencia.length > 0 && <p className="mt-2 text-xs text-stone-500">Pagamentos com pendência ficam de fora do arquivo até o CPF ser cadastrado (no paciente ou no pagamento).</p>}
            </>
          )}
        </Cartao>

        <Cartao titulo="3. Baixar o arquivo e importar no e-CAC">
          {!prof.cpf ? (
            <Aviso tom="amarelo">Cadastre primeiro o CPF da Érika (passo 1).</Aviso>
          ) : prontos.length === 0 ? (
            <p className="text-sm text-stone-500">Nada pronto para emitir neste mês.</p>
          ) : (
            <div className="space-y-4">
              <a href={`/api/receita-saude?mes=${mes}`} className="btn-primario">
                Baixar arquivo ({prontos.length} recibo{prontos.length > 1 ? 's' : ''})
              </a>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
                <li>
                  Entre no <strong>e-CAC</strong> (cav.receita.fazenda.gov.br) com o gov.br da Érika e abra o <strong>Carnê-Leão</strong>.
                </li>
                <li>
                  No menu lateral, <strong>Escrituração → Importar Escrituração</strong> e escolha o arquivo baixado.
                </li>
                <li>
                  Toque em <strong>Analisar Arquivo</strong>. Se aparecer erro, ele indica a linha — corrija aqui no sistema e baixe de novo.
                </li>
                <li>
                  Toque em <strong>Importar</strong>: os recibos são emitidos e aparecem no app Receita Saúde.
                </li>
                <li>Volte aqui e marque como emitidos:</li>
              </ol>
              <Formulario action={marcarLoteEmitido}>
                <input type="hidden" name="ids" value={prontos.map((x) => x.item.id).join(',')} />
                <BotaoEnviar variante="secundario" confirmar={`Confirmar que os ${prontos.length} recibos foram importados no e-CAC?`}>
                  Já importei: marcar {prontos.length} como emitidos
                </BotaoEnviar>
              </Formulario>
              <p className="text-xs text-stone-500">
                Errou? No e-CAC, “Histórico da Escrituração” → <strong>Desfazer escrituração</strong> cancela o lote inteiro. Prazo da Receita: o recibo deve ser emitido no momento do pagamento.
              </p>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  )
}
