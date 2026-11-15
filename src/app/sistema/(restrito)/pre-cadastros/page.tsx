import type { StatusPreCadastro } from '@prisma/client'
import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { formatarDataHora, formatarTelefone } from '@/lib/formatos'
import { AREAS, MODALIDADES, STATUS_PRE } from '@/lib/rotulos'
import { Cabecalho, Cartao, Etiqueta, Vazio } from '@/components/ui'

const TOM_PRE: Record<StatusPreCadastro, 'amarelo' | 'azul' | 'verde' | 'cinza'> = {
  NOVO: 'amarelo',
  EM_CONTATO: 'azul',
  CONVERTIDO: 'verde',
  DESCARTADO: 'cinza',
}

export default async function PreCadastros({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await exigirUsuario()
  const { ver = 'abertos' } = await searchParams
  const pedidos = await db.preCadastro.findMany({
    where: ver === 'todos' ? {} : { status: { in: ['NOVO', 'EM_CONTATO'] } },
    orderBy: { criadoEm: 'desc' },
    take: 300,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho titulo="Pedidos de contato" descricao="Enviados pelo formulário “Agende sua consulta” do site." />
      <div className="mb-4 flex gap-2 text-sm">
        {[
          ['abertos', 'Em aberto'],
          ['todos', 'Todos'],
        ].map(([v, t]) => (
          <Link key={v} href={`/sistema/pre-cadastros?ver=${v}`} className={`rounded-full px-4 py-1.5 ${ver === v ? 'bg-marca-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}>
            {t}
          </Link>
        ))}
      </div>
      <Cartao>
        {pedidos.length === 0 ? (
          <Vazio texto={ver === 'todos' ? 'Nenhum pedido recebido ainda.' : 'Nenhum pedido em aberto. 🌿'} />
        ) : (
          <ul className="-my-2 divide-y divide-stone-100">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/sistema/pre-cadastros/${p.id}`} className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-3 hover:bg-marca-50">
                  <span>
                    <span className="block font-medium text-stone-800">{p.nome}</span>
                    <span className="block text-sm text-stone-500">
                      {[formatarTelefone(p.telefone), p.area && AREAS[p.area], p.modalidade && MODALIDADES[p.modalidade]].filter(Boolean).join(' · ')}
                    </span>
                    <span className="block text-xs text-stone-400">{formatarDataHora(p.criadoEm)}</span>
                  </span>
                  <Etiqueta tom={TOM_PRE[p.status]}>{STATUS_PRE[p.status]}</Etiqueta>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
