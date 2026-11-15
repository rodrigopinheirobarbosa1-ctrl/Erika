import Link from '@/components/link'
import { exigirAcessoPacientes } from '@/lib/auth'
import { formatarReais } from '@/lib/formatos'
import { saldosPorPaciente } from '@/lib/saldos'
import { Cabecalho, Cartao, LinkBotao, Tabela, Td, Th, Vazio } from '@/components/ui'

export default async function AReceber() {
  await exigirAcessoPacientes()
  const saldos = (await saldosPorPaciente()).filter((s) => s.saldo !== 0 || s.semValor > 0).sort((a, b) => b.saldo - a.saldo)
  const total = saldos.filter((s) => s.saldo > 0).reduce((t, s) => t + s.saldo, 0)

  return (
    <div className="mx-auto max-w-4xl">
      <Cabecalho
        titulo="Contas a receber"
        descricao={`Total em aberto: ${formatarReais(total)}`}
        acoes={<LinkBotao href="/sistema/financeiro/pagamento" variante="primario">+ Pagamento recebido</LinkBotao>}
      />
      <Cartao>
        {saldos.length === 0 ? (
          <Vazio texto="Nenhum paciente com saldo em aberto." />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Paciente</Th>
                <Th alinhar="direita">Sessões</Th>
                <Th alinhar="direita">Pago</Th>
                <Th alinhar="direita">Saldo</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {saldos.map((s) => (
                <tr key={s.pacienteId}>
                  <Td>
                    <Link href={`/sistema/pacientes/${s.pacienteId}#financeiro`} className="text-marca-700 hover:underline">
                      {s.nome}
                    </Link>
                    {s.semValor > 0 && <span className="block text-xs text-amber-700">{s.semValor} sessão(ões) sem valor</span>}
                  </Td>
                  <Td alinhar="direita">{formatarReais(s.devido)}</Td>
                  <Td alinhar="direita">{formatarReais(s.pago)}</Td>
                  <Td alinhar="direita" className={s.saldo > 0 ? 'font-semibold text-red-700' : 'text-emerald-700'}>
                    {s.saldo < 0 ? `crédito ${formatarReais(-s.saldo)}` : formatarReais(s.saldo)}
                  </Td>
                  <Td alinhar="direita">
                    <Link href={`/sistema/financeiro/pagamento?paciente=${s.pacienteId}`} className="whitespace-nowrap text-xs text-marca-700 hover:underline">
                      + pagamento
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </div>
  )
}
