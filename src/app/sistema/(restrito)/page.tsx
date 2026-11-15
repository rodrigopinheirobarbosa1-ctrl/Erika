import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { formatarDataHora, formatarTelefone } from '@/lib/formatos'
import { AREAS } from '@/lib/rotulos'
import { Cabecalho, Cartao, Indicador, LinkBotao, Vazio } from '@/components/ui'

export default async function Painel() {
  const usuario = await exigirUsuario()
  const [novos, emContato, ativos, total, recentes] = await Promise.all([
    db.preCadastro.count({ where: { status: 'NOVO' } }),
    db.preCadastro.count({ where: { status: 'EM_CONTATO' } }),
    db.paciente.count({ where: { status: 'ATIVO' } }),
    db.paciente.count(),
    db.preCadastro.findMany({ where: { status: { in: ['NOVO', 'EM_CONTATO'] } }, orderBy: { criadoEm: 'desc' }, take: 5 }),
  ])
  const hora = Number(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }))
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo={`${saudacao}, ${usuario.nome.split(' ')[0]}`}
        acoes={<LinkBotao href="/sistema/pacientes/novo" variante="primario">+ Novo paciente</LinkBotao>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo="Pedidos novos" valor={novos} detalhe="Ainda sem resposta" href="/sistema/pre-cadastros" />
        <Indicador titulo="Em contato" valor={emContato} href="/sistema/pre-cadastros" />
        <Indicador titulo="Em atendimento" valor={ativos} href="/sistema/pacientes" />
        <Indicador titulo="Pacientes cadastrados" valor={total} href="/sistema/pacientes?situacao=TODOS" />
      </div>

      <Cartao titulo="Pedidos de contato em aberto" className="mt-6" acao={<Link href="/sistema/pre-cadastros" className="text-sm text-marca-700 hover:underline">Ver todos</Link>}>
        {recentes.length === 0 ? (
          <Vazio texto="Nenhum pedido em aberto." />
        ) : (
          <ul className="-my-2 divide-y divide-stone-100">
            {recentes.map((p) => (
              <li key={p.id}>
                <Link href={`/sistema/pre-cadastros/${p.id}`} className="-mx-2 flex flex-wrap justify-between gap-2 rounded-lg px-2 py-3 hover:bg-marca-50">
                  <span>
                    <span className="block font-medium text-stone-800">
                      {p.nome}
                      {p.status === 'NOVO' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">novo</span>}
                    </span>
                    <span className="block text-sm text-stone-500">{[formatarTelefone(p.telefone), p.area && AREAS[p.area]].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-xs text-stone-400">{formatarDataHora(p.criadoEm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
