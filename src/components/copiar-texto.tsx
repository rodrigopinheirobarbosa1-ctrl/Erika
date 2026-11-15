'use client'

import { useState } from 'react'

export function CopiarTexto({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      className="btn-secundario"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        } catch {
          window.prompt('Copie o texto:', texto)
        }
      }}
    >
      {copiado ? 'Copiado ✓' : rotulo}
    </button>
  )
}
