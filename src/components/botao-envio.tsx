'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { registrarEnvio } from '@/app/sistema/(restrito)/lembretes/actions'

/**
 * Abre o WhatsApp com a mensagem pronta e, ao mesmo tempo, registra o envio.
 * (O link abre na hora do toque; o registro vai em paralelo — assim o celular
 * não bloqueia a abertura do WhatsApp.)
 */
export function BotaoEnvio({
  href,
  atendimentoId,
  modeloId,
  rotulo,
  variante = 'primario',
}: {
  href: string
  atendimentoId: string
  modeloId: string
  rotulo: string
  variante?: 'primario' | 'secundario'
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-${variante} ${pendente ? 'opacity-60' : ''}`}
      onClick={() => iniciar(async () => { await registrarEnvio(atendimentoId, modeloId); router.refresh() })}
    >
      {rotulo}
    </a>
  )
}

export function BotaoPular({ atendimentoId, modeloId }: { atendimentoId: string; modeloId: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return (
    <button
      type="button"
      disabled={pendente}
      className="text-xs text-stone-500 underline-offset-2 hover:underline disabled:opacity-50"
      onClick={() => iniciar(async () => { await registrarEnvio(atendimentoId, modeloId, true); router.refresh() })}
    >
      {pendente ? '…' : 'Pular'}
    </button>
  )
}
