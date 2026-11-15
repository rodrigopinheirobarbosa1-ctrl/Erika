import type { Metadata } from 'next'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { db } from '@/lib/db'
import { site } from '@/lib/site'
import { formatarTelefone } from '@/lib/formatos'
import { MODELOS, numerar, type Campo } from '@/lib/anamnese/modelo'
import { nomeCampo, nomeOutro } from '@/lib/anamnese/respostas'
import { enviarFicha } from './actions'
import { FormularioFicha } from './formulario'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Ficha de anamnese · ${site.nome}, ${site.profissao}`, robots: { index: false, follow: false } }

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blush/70 to-creme px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <Image src="/img/logo.png" alt={`${site.nome} Psicóloga`} width={110} height={110} className="mx-auto h-24 w-24" priority />
          <p className="marca-texto mt-3 text-xs text-terracota">
            {site.profissao} · {site.crp}
          </p>
        </header>
        {children}
        <p className="mt-8 text-center text-xs text-tinta/60">
          Em caso de crise ou risco à vida, ligue 188 (CVV, 24h) ou 192 (SAMU). Esta ficha não é atendimento de urgência.
        </p>
      </div>
    </main>
  )
}

function CampoFicha({ c, inicial }: { c: Campo; inicial?: string }) {
  const rotulo = <span className="mb-1.5 block text-[0.95rem] text-tinta">{c.rotulo}{'obrigatorio' in c && c.obrigatorio ? ' *' : ''}</span>
  const dica = 'dica' in c && c.dica ? <span className="mt-1 block text-xs italic text-tinta/60">{c.dica}</span> : null
  const pilula = 'inline-block rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 transition peer-checked:border-terracota peer-checked:bg-terracota peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-terracota/40'

  if (c.tipo === 'escolha' || c.tipo === 'multipla') {
    const tipo = c.tipo === 'escolha' ? 'radio' : 'checkbox'
    return (
      <fieldset>
        <legend className="mb-1.5 block text-[0.95rem] text-tinta">{c.rotulo}</legend>
        <div className="flex flex-wrap gap-2">
          {[...c.opcoes, ...(c.outro ? [c.outro] : [])].map((o) => (
            <label key={o} className="cursor-pointer">
              <input type={tipo} name={nomeCampo(c.id)} value={o} className="peer sr-only" />
              <span className={pilula}>{o}</span>
            </label>
          ))}
        </div>
        {c.outro && <input name={nomeOutro(c.id)} className="campo mt-2" placeholder={`${c.outro}: qual?`} maxLength={200} aria-label={`${c.rotulo} — ${c.outro}`} />}
      </fieldset>
    )
  }
  if (c.tipo === 'longo') {
    return (
      <label className="block">
        {rotulo}
        <textarea name={nomeCampo(c.id)} rows={4} maxLength={5000} className="campo" />
        {dica}
      </label>
    )
  }
  const tipos = { texto: 'text', data: 'date', telefone: 'tel', email: 'email', cpf: 'text' } as const
  return (
    <label className="block">
      {rotulo}
      <input
        type={tipos[c.tipo]}
        name={nomeCampo(c.id)}
        defaultValue={inicial}
        required={'obrigatorio' in c && c.obrigatorio}
        inputMode={c.tipo === 'telefone' ? 'tel' : c.tipo === 'cpf' ? 'numeric' : undefined}
        autoComplete={c.id === 'nome' ? 'name' : c.tipo === 'email' ? 'email' : c.tipo === 'telefone' && c.id === 'telefone' ? 'tel' : 'off'}
        maxLength={200}
        className="campo"
      />
      {dica}
    </label>
  )
}

export default async function FichaPublica({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ficha = await db.fichaAnamnese.findUnique({
    where: { token },
    include: { preCadastro: { select: { nome: true, telefone: true, email: true } }, paciente: { select: { nome: true, telefone: true, email: true } } },
  })

  if (!ficha || ficha.status === 'CANCELADA' || (ficha.status === 'PENDENTE' && ficha.expiraEm < new Date())) {
    return (
      <Moldura>
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-nude/70">
          <p className="font-serif text-2xl text-cacau">Este link não está mais disponível</p>
          <p className="mt-3 text-tinta/80">Ele pode ter expirado ou sido substituído. Peça um novo link à psicóloga.</p>
        </div>
      </Moldura>
    )
  }
  if (ficha.status === 'RESPONDIDA') {
    return (
      <Moldura>
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-nude/70">
          <p className="font-serif text-2xl text-cacau">Ficha já enviada</p>
          <p className="mt-3 text-tinta/80">Recebemos suas respostas. Obrigada! Se quiser acrescentar algo, conte diretamente à psicóloga.</p>
        </div>
      </Moldura>
    )
  }

  const modelo = MODELOS[ficha.modeloVersao]
  const pessoa = ficha.paciente ?? ficha.preCadastro
  const iniciais: Record<string, string> = {
    nome: pessoa?.nome ?? ficha.nomeDestinatario,
    telefone: pessoa?.telefone ? formatarTelefone(pessoa.telefone) : '',
    email: pessoa?.email ?? '',
  }

  return (
    <Moldura>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-4xl text-cacau">{modelo.titulo}</h1>
        <p className="mt-3 leading-relaxed text-tinta/85">
          Olá, {ficha.nomeDestinatario.split(' ')[0]}! Responda no seu tempo — não há respostas certas ou erradas, e você pode deixar em
          branco o que preferir conversar pessoalmente. Leva cerca de 10 minutos.
        </p>
        <p className="mt-2 text-sm text-tinta/60">🔒 Suas respostas são sigilosas e só a psicóloga tem acesso.</p>
      </div>

      <FormularioFicha action={enviarFicha.bind(null, token)} nome={ficha.nomeDestinatario}>
        {modelo.secoes.map((s, i) => (
          <section key={s.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-nude/70 sm:p-7">
            <h2 className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm uppercase tracking-wider text-cacau">
              <span aria-hidden="true">{s.icone}</span> {numerar(modelo)[i]}
            </h2>
            {s.nota && <p className="mt-2 text-xs italic text-tinta/60">{s.nota}</p>}
            <div className="mt-5 space-y-5">
              {s.campos.map((c) => (
                <CampoFicha key={c.id} c={c} inicial={iniciais[c.id]} />
              ))}
            </div>
          </section>
        ))}
        <label className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 text-sm text-stone-700">
          <input type="checkbox" name="consentimento" required className="mt-0.5 h-5 w-5 shrink-0 accent-terracota" />
          <span>
            Concordo que estas informações sejam usadas apenas pela psicóloga {site.nomeCompleto} ({site.crp}) para o meu atendimento,
            guardadas com sigilo profissional, conforme a{' '}
            <a href="/privacidade" target="_blank" className="text-terracota-escuro underline">
              política de privacidade
            </a>
            . *
          </span>
        </label>
      </FormularioFicha>
    </Moldura>
  )
}
