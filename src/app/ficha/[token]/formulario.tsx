'use client'

import { startTransition, useActionState, type ReactNode } from 'react'
import type { EstadoForm } from '@/components/form'

/** Formulário da ficha: depois de enviado, troca tudo por um agradecimento. */
export function FormularioFicha({ action, children, nome }: { action: (e: EstadoForm, d: FormData) => Promise<EstadoForm>; children: ReactNode; nome: string }) {
  const [estado, executar, enviando] = useActionState(action, null)
  if (estado?.ok) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-nude/70">
        <p className="font-serif text-3xl text-cacau">Obrigada, {nome.split(' ')[0]}!</p>
        <p className="mt-4 leading-relaxed text-tinta/85">
          Sua ficha foi enviada com segurança. A Érika vai ler com atenção e entrar em contato para os próximos passos.
        </p>
        <p className="mt-6 text-sm text-tinta/60">Pode fechar esta página.</p>
      </div>
    )
  }
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        const dados = new FormData(e.currentTarget)
        startTransition(() => executar(dados))
      }}
    >
      {children}
      {estado?.erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{estado.erro}</div>}
      <button type="submit" disabled={enviando} className="btn-site w-full disabled:opacity-60">
        {enviando ? 'Enviando…' : 'Enviar ficha'}
      </button>
    </form>
  )
}
