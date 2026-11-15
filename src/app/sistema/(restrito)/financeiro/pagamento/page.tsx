import { db } from '@/lib/db'
import { exigirAcessoPacientes } from '@/lib/auth'
import { formatarReais } from '@/lib/formatos'
import { hojeLocal } from '@/lib/horario'
import { saldosPorPaciente } from '@/lib/saldos'
import { FORMAS_PAGAMENTO, opcoes } from '@/lib/rotulos'
import { Aviso, Cabecalho, Cartao, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { registrarPagamento } from '../actions'

export default async function NovoPagamento({ searchParams }: { searchParams: Promise<{ paciente?: string }> }) {
  await exigirAcessoPacientes()
  const { paciente } = await searchParams
  const pacientes = await db.paciente.findMany({ where: { status: { not: 'INATIVO' } }, orderBy: { nome: 'asc' }, select: { id: true, nome: true, nomeSocial: true, responsavelNome: true } })
  const saldo = paciente ? (await saldosPorPaciente()).find((s) => s.pacienteId === paciente) : undefined
  const selecionado = pacientes.find((p) => p.id === paciente)

  return (
    <div className="mx-auto max-w-xl">
      <Cabecalho titulo="Pagamento recebido" acoes={<LinkBotao href={paciente ? `/sistema/pacientes/${paciente}#financeiro` : '/sistema/financeiro/receber'}>Voltar</LinkBotao>} />
      {saldo && (
        <div className="mb-4">
          <Aviso tom={saldo.saldo > 0 ? 'amarelo' : 'verde'}>
            {saldo.saldo > 0
              ? `${saldo.nome} tem ${formatarReais(saldo.saldo)} em aberto.`
              : saldo.saldo < 0
                ? `${saldo.nome} tem crédito de ${formatarReais(-saldo.saldo)} (pagou adiantado).`
                : `${saldo.nome} está com a conta em dia.`}
          </Aviso>
        </div>
      )}
      <Cartao>
        <Formulario action={registrarPagamento} className="grid gap-4 sm:grid-cols-2">
          <Selecao
            rotulo="Paciente"
            nome="pacienteId"
            obrigatorio
            vazio="Escolha…"
            valor={paciente}
            opcoes={pacientes.map((p) => ({ valor: p.id, texto: p.nomeSocial ? `${p.nomeSocial} (${p.nome})` : p.nome }))}
            className="sm:col-span-2"
          />
          <Texto rotulo="Valor (R$)" nome="valor" modo="decimal" obrigatorio valor={saldo && saldo.saldo > 0 ? (saldo.saldo / 100).toFixed(2).replace('.', ',') : ''} />
          <Texto rotulo="Data do pagamento" nome="data" tipo="date" obrigatorio valor={hojeLocal()} />
          <Selecao rotulo="Forma" nome="forma" valor="PIX" opcoes={opcoes(FORMAS_PAGAMENTO)} />
          <div className="hidden sm:block" />
          <Texto
            rotulo="Quem pagou (se não foi o paciente)"
            nome="pagadorNome"
            valor={selecionado?.responsavelNome ?? ''}
            dica="Ex.: responsável, cônjuge. Vai para o relatório do carnê-leão."
          />
          <Texto rotulo="CPF de quem pagou" nome="pagadorCpf" modo="numeric" placeholder="000.000.000-00" />
          <Texto rotulo="Observação" nome="observacao" maximo={300} className="sm:col-span-2" placeholder="Ex.: pacote de 4 sessões de novembro" />
          <div className="sm:col-span-2">
            <Caixa rotulo="Recibo já emitido no app Receita Saúde" nome="reciboEmitido" />
          </div>
          <div className="sm:col-span-2">
            <BotaoEnviar>Registrar pagamento</BotaoEnviar>
          </div>
        </Formulario>
      </Cartao>
    </div>
  )
}
