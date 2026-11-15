'use client'

import Image from 'next/image'
import Link from '@/components/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PAPEIS, gereUsuarios, veHistorico, vePacientes, type Papel } from '@/lib/permissoes'

type Item = { href: string; texto: string; pode?: (p: Papel) => boolean; contador?: boolean }

const ITENS: Item[] = [
  { href: '/sistema', texto: 'Painel' },
  { href: '/sistema/pre-cadastros', texto: 'Pedidos de contato', contador: true, pode: vePacientes },
  { href: '/sistema/pacientes', texto: 'Pacientes', pode: vePacientes },
  { href: '/sistema/usuarios', texto: 'Usuários', pode: gereUsuarios },
  { href: '/sistema/historico', texto: 'Histórico de acessos', pode: veHistorico },
  { href: '/sistema/minha-senha', texto: 'Minha senha' },
]

function FormSair({ className = '' }: { className?: string }) {
  return (
    <form action="/api/sair" method="post" className={className}>
      <button type="submit" className="text-sm text-stone-500 underline-offset-2 hover:text-red-700 hover:underline">
        Sair
      </button>
    </form>
  )
}

export function Menu({
  usuario,
  novosPedidos = 0,
}: {
  usuario: { nome: string; papel: Papel }
  novosPedidos?: number
}) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)
  const ativo = (href: string) => (href === '/sistema' ? caminho === href : caminho === href || caminho.startsWith(href + '/'))

  const lista = (
    <nav>
      <ul className="space-y-0.5">
        {ITENS.filter((i) => !i.pode || i.pode(usuario.papel)).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setAberto(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                ativo(item.href) ? 'bg-marca-600 font-medium text-white' : 'text-stone-600 hover:bg-marca-50'
              }`}
            >
              {item.texto}
              {item.contador && novosPedidos > 0 && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${ativo(item.href) ? 'bg-white text-marca-700' : 'bg-amber-100 text-amber-800'}`}>
                  {novosPedidos}
                </span>
              )}
            </Link>
          </li>
        ))}
        <li className="mt-2 border-t border-stone-100 pt-2">
          {/* Abre o site público numa aba nova: o sistema continua aberto e logado. */}
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-stone-600 transition hover:bg-marca-50"
          >
            Ver o site
            <span aria-hidden="true">↗</span>
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </li>
      </ul>
    </nav>
  )

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2.5 lg:hidden nao-imprimir">
        <Link href="/sistema" className="flex items-center gap-2">
          <Image src="/img/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="marca-texto text-xs text-cacau">Consultório</span>
        </Link>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="relative rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700"
          aria-expanded={aberto}
        >
          {aberto ? 'Fechar' : 'Menu'}
          {!aberto && novosPedidos > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-500" />}
        </button>
      </div>

      {aberto && (
        <div className="border-b border-stone-200 bg-white px-4 py-4 lg:hidden nao-imprimir">
          {lista}
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="text-sm text-stone-600">{usuario.nome}</span>
            <FormSair />
          </div>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white lg:flex lg:flex-col nao-imprimir">
        <Link href="/sistema" className="flex flex-col items-center border-b border-stone-200 px-5 py-5">
          <Image src="/img/logo.png" alt="Érika Dias Psicóloga" width={88} height={88} className="h-[88px] w-[88px]" />
          <span className="mt-2 text-xs text-stone-400">Sistema do consultório</span>
        </Link>
        <div className="flex-1 overflow-y-auto px-2 py-4">{lista}</div>
        <div className="border-t border-stone-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-stone-700">{usuario.nome}</p>
          <p className="truncate text-xs text-stone-400">{PAPEIS[usuario.papel].nome}</p>
          <FormSair className="mt-2" />
        </div>
      </aside>
    </>
  )
}
