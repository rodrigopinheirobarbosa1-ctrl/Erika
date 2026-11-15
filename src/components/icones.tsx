// Ícones em traço fino, no estilo dos destaques do Instagram.
import type { ReactNode } from 'react'

function Svg({ children, className = 'h-10 w-10' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconeGestacao = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="22" cy="9" r="4" />
    <path d="M20 13.5c-2.5 2-3.5 5-3 8.5.4 3-1 5-1 8 0 4 2 7 5 9v5" />
    <path d="M24 14c1 2.5 1 5 0 7.5 4 0 9 3.5 9 9.5 0 5-4 8.5-9 8.5h-3" />
    <path d="M24 21.5c-2 .5-3.5 2-4 4" />
    <path d="M27 31.5c.8-1 2.2-1 2.6.2.4 1.2-1.2 2.4-2.6 3.3-1.4-.9-3-2.1-2.6-3.3.4-1.2 1.8-1.2 2.6-.2z" />
  </Svg>
)

export const IconeCoracao = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M24 39S8 29.5 8 18.5C8 13 12 9.5 16.5 9.5c3.3 0 5.9 2 7.5 4.8 1.6-2.8 4.2-4.8 7.5-4.8C36 9.5 40 13 40 18.5 40 29.5 24 39 24 39z" />
  </Svg>
)

export const IconeBroto = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M24 42V22" />
    <path d="M24 30c-1-6-6-10-14-10 0 7 6 11 14 10z" />
    <path d="M24 24c1-7 6-12 15-12 0 8-6 13-15 12z" />
    <path d="M24 30l-8-6M24 24l9-7" />
  </Svg>
)

export const IconeMente = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M24 10v30" />
    <path d="M24 12c-1.5-2.5-6-3-8 0-3-.5-5.5 2-5 5-3 1-4 5-2 7.5-2 2.5-1 6.5 2 7.5 0 3 3 5.5 6 4.5 1.5 2.5 5.5 2.5 7 0" />
    <path d="M24 12c1.5-2.5 6-3 8 0 3-.5 5.5 2 5 5 3 1 4 5 2 7.5 2 2.5 1 6.5-2 7.5 0 3-3 5.5-6 4.5-1.5 2.5-5.5 2.5-7 0" />
    <path d="M16 19c2 0 3.5 1.5 3.5 3.5M14 27c2-1 4.5-.5 5.5 1.5M32 19c-2 0-3.5 1.5-3.5 3.5M34 27c-2-1-4.5-.5-5.5 1.5" />
  </Svg>
)

export const IconeConversa = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M9 12a3 3 0 013-3h24a3 3 0 013 3v17a3 3 0 01-3 3H20l-8 7v-7h0a3 3 0 01-3-3V12z" />
    <path d="M24 26.5s-6-3.5-6-7.5c0-2 1.5-3.3 3.2-3.3 1.3 0 2.2.8 2.8 1.8.6-1 1.5-1.8 2.8-1.8 1.7 0 3.2 1.3 3.2 3.3 0 4-6 7.5-6 7.5z" />
  </Svg>
)

export const IconeAgenda = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="8" y="11" width="32" height="29" rx="3" />
    <path d="M8 18h32M16 7v7M32 7v7" />
    <path d="M24 35s-5.5-3.2-5.5-6.8c0-1.8 1.3-3 2.9-3 1.2 0 2 .7 2.6 1.6.6-.9 1.4-1.6 2.6-1.6 1.6 0 2.9 1.2 2.9 3 0 3.6-5.5 6.8-5.5 6.8z" />
  </Svg>
)

export const IconeFolha = ({ className = 'h-16 w-16' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M10 56C22 44 34 30 52 10" />
    <path d="M22 44c-6-1-9-6-9-12 6 1 9 6 9 12zM30 35c-1-7 2-12 8-14 1 7-2 12-8 14zM31 34c-6-2-9-7-8-13 6 2 9 7 8 13zM40 24c0-6 4-10 10-11 0 6-4 10-10 11z" />
  </svg>
)

export const IconeCheck = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="currentColor" />
    <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconeWhatsapp = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 001.8-1.3 2.3 2.3 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" />
  </svg>
)
