import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { descriptografar } from '@/lib/cripto'
import { formatarDataHora } from '@/lib/formatos'
import { site } from '@/lib/site'
import { MODELOS } from '@/lib/anamnese/modelo'
import { apresentar, type Respostas } from '@/lib/anamnese/respostas'
import { BotaoImprimir } from '@/components/botao-imprimir'

/** Respostas da ficha de anamnese (só a psicóloga e o administrador do sistema). */
export default async function RespostasFicha({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  if (!podeVerClinico(usuario)) redirect('/sistema')
  const { id } = await params
  const f = await db.fichaAnamnese.findUnique({ where: { id } })
  if (!f || f.status !== 'RESPONDIDA' || !f.respostasCripto) notFound()
  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'FichaAnamnese', entidadeId: f.id, resumo: `Abriu a ficha de anamnese de ${f.nomeDestinatario}` })

  const respostas = JSON.parse(descriptografar(f.respostasCripto)!) as Respostas
  const secoes = apresentar(MODELOS[respostas.versao], respostas)
  const voltar = f.pacienteId ? `/sistema/pacientes/${f.pacienteId}` : f.preCadastroId ? `/sistema/pre-cadastros/${f.preCadastroId}` : '/sistema'

  return (
    <div className="mx-auto max-w-3xl bg-white p-4 text-stone-900 sm:p-6 print:p-0">
      <div className="mb-5 flex flex-wrap justify-between gap-2 nao-imprimir">
        <a href={voltar} className="text-sm text-marca-700 underline">
          ← Voltar
        </a>
        <BotaoImprimir />
      </div>
      <header className="border-b border-stone-300 pb-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {site.nomeCompleto} · {site.profissao} · {site.crp}
        </p>
        <h1 className="mt-1 font-serif text-3xl">{MODELOS[respostas.versao].titulo}</h1>
        <p className="text-sm">
          <strong>{f.nomeDestinatario}</strong> · respondida pelo(a) paciente em {formatarDataHora(f.respondidaEm!)} · documento sigiloso
        </p>
      </header>
      {secoes.map((s) => (
        <section key={s.titulo} className="mt-6 break-inside-avoid">
          <h2 className="font-serif text-xl text-cacau">{s.titulo}</h2>
          <dl className="mt-2 space-y-2">
            {s.itens.map((it) => (
              <div key={it.rotulo}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{it.rotulo}</dt>
                <dd className={`whitespace-pre-wrap text-sm ${it.valor ? 'text-stone-900' : 'text-stone-400'}`}>{it.valor || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
