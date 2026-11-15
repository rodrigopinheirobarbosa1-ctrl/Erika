import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { descriptografar } from '@/lib/cripto'
import { formatarCpf, formatarData, formatarDataHora } from '@/lib/formatos'
import { rotuloInstante } from '@/lib/horario'
import { site } from '@/lib/site'
import { STATUS_ATENDIMENTO, TIPOS_REGISTRO } from '@/lib/rotulos'
import { BotaoImprimir } from '@/components/botao-imprimir'
import { MODELOS } from '@/lib/anamnese/modelo'
import { apresentar, type Respostas } from '@/lib/anamnese/respostas'

/** Prontuário completo, pronto para imprimir ou salvar em PDF (direito do paciente). */
export default async function ProntuarioCompleto({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirAcessoPacientes()
  if (!podeVerClinico(usuario)) redirect('/sistema')
  const { id } = await params
  const p = await db.paciente.findUnique({
    where: { id },
    include: {
      registros: { orderBy: { criadoEm: 'asc' }, include: { atendimento: { select: { inicio: true } } } },
      atendimentos: { orderBy: { inicio: 'asc' }, where: { status: { in: ['REALIZADO', 'FALTOU'] } } },
      fichas: { where: { status: 'RESPONDIDA' }, orderBy: { respondidaEm: 'asc' } },
    },
  })
  if (!p) notFound()
  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'Prontuario', entidadeId: p.id, resumo: `Abriu o prontuário completo (impressão) de ${p.nome}` })

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-stone-900 print:p-0">
      <div className="mb-6 flex items-start justify-between gap-4 nao-imprimir">
        <a href={`/sistema/pacientes/${p.id}`} className="text-sm text-marca-700 underline">
          ← Voltar à ficha
        </a>
        <BotaoImprimir />
      </div>
      <header className="border-b border-stone-300 pb-4">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {site.nomeCompleto} · {site.profissao} · {site.crp}
        </p>
        <h1 className="mt-2 font-serif text-3xl">Prontuário psicológico</h1>
        <p className="mt-1 text-sm">
          <strong>{p.nome}</strong>
          {p.dataNascimento && ` · nascimento ${formatarData(p.dataNascimento)}`}
          {p.cpf && ` · CPF ${formatarCpf(p.cpf)}`}
        </p>
        <p className="text-xs text-stone-500">Emitido em {formatarDataHora(new Date())} · documento sigiloso</p>
      </header>

      {p.fichas.map((f) => {
        const r = JSON.parse(descriptografar(f.respostasCripto)!) as Respostas
        return (
          <section key={f.id} className="mt-6">
            <h2 className="font-serif text-xl">Ficha de anamnese (respondida pelo paciente em {formatarDataHora(f.respondidaEm!)})</h2>
            {apresentar(MODELOS[r.versao], r).map((s) => (
              <div key={s.titulo} className="mt-3 break-inside-avoid">
                <p className="text-sm font-semibold">{s.titulo}</p>
                {s.itens.filter((i) => i.valor).map((i) => (
                  <p key={i.rotulo} className="whitespace-pre-wrap text-sm">
                    <span className="text-stone-500">{i.rotulo}:</span> {i.valor}
                  </p>
                ))}
              </div>
            ))}
          </section>
        )
      })}

      {p.queixaCripto && (
        <section className="mt-6">
          <h2 className="font-serif text-xl">Demanda inicial</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{descriptografar(p.queixaCripto)}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-serif text-xl">Atendimentos ({p.atendimentos.length})</h2>
        <p className="mt-2 text-sm">
          {p.atendimentos.length === 0 ? 'Nenhum.' : p.atendimentos.map((a) => `${rotuloInstante(a.inicio)} (${STATUS_ATENDIMENTO[a.status].toLowerCase()})`).join('; ')}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl">Registros</h2>
        {p.registros.length === 0 && <p className="mt-2 text-sm">Nenhum registro.</p>}
        <ol className="mt-3 space-y-4">
          {p.registros.map((r) => (
            <li key={r.id} className="break-inside-avoid border-l-2 border-stone-300 pl-3">
              <p className="text-xs text-stone-500">
                <strong>{TIPOS_REGISTRO[r.tipo]}</strong>
                {r.atendimento && ` · sessão de ${rotuloInstante(r.atendimento.inicio)}`} · registrado em {formatarDataHora(r.criadoEm)} por {r.autorNome}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{descriptografar(r.textoCripto)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
