'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { marcarLoteEmitido } from './actions'

export type ItemTela = { id: string; data: string; paciente: string; pacienteId: string; valor: string; centavos: number; pendencias: string[] }

const reais = (c: number) => `R$ ${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Lista com caixinhas: escolher quais pagamentos entram no arquivo do Receita Saúde. */
export function SelecaoRecibos({ itens, mes, temCpf }: { itens: ItemTela[]; mes: string; temCpf: boolean }) {
  const router = useRouter()
  const prontos = itens.filter((i) => i.pendencias.length === 0)
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set(prontos.map((i) => i.id)))
  const [msg, setMsg] = useState<{ ok?: string; erro?: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  const alternar = (id: string) =>
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  const escolhidos = prontos.filter((i) => marcados.has(i.id))
  const total = escolhidos.reduce((t, i) => t + i.centavos, 0)
  const ids = escolhidos.map((i) => i.id).join(',')

  const marcarEmitidos = () => {
    if (!window.confirm(`Confirmar que os ${escolhidos.length} recibos selecionados foram emitidos no Receita Saúde?`)) return
    const dados = new FormData()
    dados.set('ids', ids)
    iniciar(async () => {
      setMsg(await marcarLoteEmitido(null, dados))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {prontos.length > 1 && (
        <div className="flex gap-3 text-sm">
          <button type="button" className="text-marca-700 underline" onClick={() => setMarcados(new Set(prontos.map((i) => i.id)))}>
            Selecionar todos
          </button>
          <button type="button" className="text-marca-700 underline" onClick={() => setMarcados(new Set())}>
            Limpar seleção
          </button>
        </div>
      )}
      <ul className="divide-y divide-stone-100 text-sm">
        {itens.map((i) => {
          const bloqueado = i.pendencias.length > 0
          return (
            <li key={i.id} className="py-2">
              <label className={`flex items-start gap-3 ${bloqueado ? 'opacity-70' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-marca-600"
                  checked={!bloqueado && marcados.has(i.id)}
                  disabled={bloqueado}
                  onChange={() => alternar(i.id)}
                />
                <span className="flex-1">
                  {i.data} · {i.paciente}
                  {bloqueado && (
                    <span className="block text-xs text-amber-800">
                      {i.pendencias.join(' · ')} —{' '}
                      <Link href={`/sistema/pacientes/${i.pacienteId}/editar`} className="underline">
                        completar cadastro
                      </Link>
                    </span>
                  )}
                </span>
                <span className="tabular-nums">{i.valor}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="rounded-lg bg-stone-50 p-3 text-sm">
        <strong>{escolhidos.length}</strong> selecionado(s) · {reais(total)}
      </div>

      {!temCpf ? (
        <p className="text-sm text-amber-800">Cadastre primeiro o CPF da Érika (passo 1).</p>
      ) : escolhidos.length === 0 ? (
        <p className="text-sm text-stone-500">Marque ao menos um pagamento.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <a href={`/api/receita-saude?mes=${mes}&ids=${ids}`} className="btn-primario">
            Baixar arquivo ({escolhidos.length} recibo{escolhidos.length > 1 ? 's' : ''})
          </a>
          <button type="button" className="btn-secundario" disabled={pendente} onClick={marcarEmitidos}>
            {pendente ? 'Aguarde…' : `Marcar ${escolhidos.length} como emitidos`}
          </button>
        </div>
      )}
      {msg?.ok && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg.ok}</p>}
      {msg?.erro && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{msg.erro}</p>}
    </div>
  )
}
