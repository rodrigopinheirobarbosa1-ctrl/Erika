import type { RegistroProntuario } from '@prisma/client'
import Link from '@/components/link'
import { descriptografar } from '@/lib/cripto'
import { formatarDataHora } from '@/lib/formatos'
import { rotuloInstante } from '@/lib/horario'
import { TIPOS_REGISTRO } from '@/lib/rotulos'
import { BotaoEnviar, Formulario } from '@/components/form'
import { registrarNoProntuario } from '@/app/sistema/(restrito)/pacientes/prontuario-actions'

type Registro = RegistroProntuario & { atendimento?: { id: string; inicio: Date } | null }

/** Formulário de novo registro (evolução de uma sessão, anotação ou retificação). */
export function NovoRegistro({
  pacienteId,
  atendimentoId,
  retificaId,
  titulo,
  dica,
}: {
  pacienteId: string
  atendimentoId?: string
  retificaId?: string
  titulo: string
  dica?: string
}) {
  return (
    <Formulario action={registrarNoProntuario.bind(null, pacienteId)} limparAoSalvar className="space-y-3">
      {atendimentoId && <input type="hidden" name="atendimentoId" value={atendimentoId} />}
      {retificaId && <input type="hidden" name="retificaId" value={retificaId} />}
      <label className="block">
        <span className="rotulo">{titulo}</span>
        <textarea name="texto" rows={retificaId ? 3 : 6} required className="campo" />
        <span className="mt-1 block text-xs text-stone-400">
          {dica ?? '🔒 Criptografado. Depois de salvo não pode ser alterado nem apagado; correções viram retificação.'}
        </span>
      </label>
      <BotaoEnviar>Salvar no prontuário</BotaoEnviar>
    </Formulario>
  )
}

/** Linha do tempo do prontuário, com as retificações abaixo de cada registro. */
export function LinhaDoTempo({
  registros,
  pacienteId,
  podeEscrever,
  mostrarSessao = true,
}: {
  registros: Registro[]
  pacienteId: string
  podeEscrever: boolean
  mostrarSessao?: boolean
}) {
  const principais = registros.filter((r) => !r.retificaId)
  const retificacoesDe = (id: string) => registros.filter((r) => r.retificaId === id).sort((a, b) => +a.criadoEm - +b.criadoEm)
  if (principais.length === 0) return <p className="text-sm text-stone-500">Nenhum registro ainda.</p>

  return (
    <ol className="space-y-4">
      {principais.map((r) => (
        <li key={r.id} className="rounded-lg border border-stone-200 p-3">
          <p className="text-xs text-stone-500">
            <strong className="text-stone-700">{TIPOS_REGISTRO[r.tipo]}</strong>
            {mostrarSessao && r.atendimento && (
              <>
                {' · sessão de '}
                <Link href={`/sistema/agenda/${r.atendimento.id}`} className="underline">
                  {rotuloInstante(r.atendimento.inicio)}
                </Link>
              </>
            )}
            {' · '}registrado em {formatarDataHora(r.criadoEm)} por {r.autorNome}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{descriptografar(r.textoCripto)}</p>

          {retificacoesDe(r.id).map((ret) => (
            <div key={ret.id} className="mt-3 border-l-2 border-amber-300 pl-3">
              <p className="text-xs text-amber-800">
                <strong>Retificação</strong> · {formatarDataHora(ret.criadoEm)} por {ret.autorNome}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{descriptografar(ret.textoCripto)}</p>
            </div>
          ))}

          {podeEscrever && (
            <details className="mt-3 nao-imprimir">
              <summary className="cursor-pointer text-xs font-medium text-marca-700">Adicionar retificação</summary>
              <div className="mt-2">
                <NovoRegistro pacienteId={pacienteId} retificaId={r.id} titulo="Texto da retificação" dica="O registro original continua guardado; a retificação fica logo abaixo dele." />
              </div>
            </details>
          )}
        </li>
      ))}
    </ol>
  )
}
