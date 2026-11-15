'use client'

import Image from 'next/image'
import { useState } from 'react'
import { site } from '@/lib/site'

const LINKS = [
  { href: '#areas', texto: 'Áreas de atuação' },
  { href: '#atendimento', texto: 'Como funciona' },
  { href: '#sobre', texto: 'Sobre mim' },
]

export function CabecalhoSite() {
  const [aberto, setAberto] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-nude/60 bg-creme/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex items-center gap-3" onClick={() => setAberto(false)}>
          <Image src="/img/logo.png" alt="" width={44} height={44} className="h-11 w-11" priority />
          <span className="leading-tight">
            <span className="marca-texto block text-sm text-cacau">{site.nome}</span>
            <span className="marca-texto block text-[0.62rem] text-terracota">{site.profissao}</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Seções do site">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-tinta/80 transition hover:text-terracota">
              {l.texto}
            </a>
          ))}
          <a href="#agende" className="btn-site !px-5 !py-2 !text-sm">
            Agende sua consulta
          </a>
        </nav>

        <button
          type="button"
          className="rounded-full border border-terracota/40 px-4 py-2 text-sm text-terracota-escuro md:hidden"
          aria-expanded={aberto}
          aria-controls="menu-celular"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? 'Fechar' : 'Menu'}
        </button>
      </div>

      {aberto && (
        <nav id="menu-celular" className="border-t border-nude/60 bg-creme px-4 pb-5 pt-2 md:hidden" aria-label="Seções do site">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setAberto(false)} className="block border-b border-nude/50 py-3.5 text-base text-tinta">
              {l.texto}
            </a>
          ))}
          <a href="#agende" onClick={() => setAberto(false)} className="btn-site mt-4 w-full">
            Agende sua consulta
          </a>
        </nav>
      )}
    </header>
  )
}
