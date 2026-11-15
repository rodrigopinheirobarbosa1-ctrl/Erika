'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { registrarInteresseWhatsapp } from '@/app/acoes-publicas'

const EVENTO = 'abrir-contato-whatsapp'

/**
 * Qualquer botão de WhatsApp do site. Sem JavaScript, o link abre o WhatsApp
 * direto; com JavaScript, abre a janelinha de nome + telefone antes.
 */
export function BotaoWhatsapp({ href, className, children, rotulo }: { href: string; className?: string; children: ReactNode; rotulo?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rotulo}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(EVENTO, { detail: href }))
      }}
    >
      {children}
    </a>
  )
}

/** A janelinha (uma por página). */
export function JanelaWhatsapp() {
  const janela = useRef<HTMLDialogElement>(null)
  const [linkDireto, setLinkDireto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const abrir = (e: Event) => {
      setLinkDireto((e as CustomEvent<string>).detail)
      setErro('')
      janela.current?.showModal()
    }
    window.addEventListener(EVENTO, abrir)
    return () => window.removeEventListener(EVENTO, abrir)
  }, [])

  return (
    <dialog
      ref={janela}
      aria-labelledby="titulo-whatsapp"
      className="w-[calc(100%-2rem)] max-w-md rounded-3xl bg-creme p-0 text-tinta shadow-xl backdrop:bg-cacau/40"
      onClick={(e) => {
        if (e.target === janela.current) janela.current.close() // toque fora fecha
      }}
    >
      <form
        className="space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setEnviando(true)
          setErro('')
          try {
            const r = await registrarInteresseWhatsapp(new FormData(e.currentTarget))
            if (r.erro) setErro(r.erro)
            else if (r.link) {
              janela.current?.close()
              window.location.href = r.link
            }
          } catch {
            window.location.href = linkDireto // se o registro falhar, a pessoa não fica sem contato
          } finally {
            setEnviando(false)
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="titulo-whatsapp" className="font-serif text-2xl text-cacau">
            Falar pelo WhatsApp
          </h2>
          <button type="button" onClick={() => janela.current?.close()} className="rounded-full px-2 text-2xl leading-none text-tinta/60" aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="text-sm text-tinta/80">Me diga seu nome e WhatsApp para eu já saber quem é você. Em seguida, a conversa abre.</p>
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="block">
          <span className="rotulo">Seu nome</span>
          <input name="nome" required autoComplete="name" maxLength={120} className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">Seu WhatsApp (com DDD)</span>
          <input name="telefone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="(61) 99999-9999" className="campo" />
        </label>
        <label className="flex items-start gap-3 text-xs text-stone-700">
          <input type="checkbox" name="consentimento" required className="mt-0.5 h-5 w-5 shrink-0 accent-terracota" />
          <span>
            Concordo que meus dados sejam usados só para a psicóloga entrar em contato comigo (
            <Link href="/privacidade" target="_blank" className="underline">
              privacidade
            </Link>
            ).
          </span>
        </label>
        {erro && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}
        <button type="submit" disabled={enviando} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-base text-white disabled:opacity-60">
          {enviando ? 'Abrindo…' : 'Continuar no WhatsApp'}
        </button>
        <p className="text-center">
          <a href={linkDireto} className="text-xs text-tinta/60 underline underline-offset-2">
            Prefiro abrir o WhatsApp sem preencher
          </a>
        </p>
      </form>
    </dialog>
  )
}
