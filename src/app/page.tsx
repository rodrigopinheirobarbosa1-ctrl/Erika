import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { site } from '@/lib/site'
import { linkWhatsapp } from '@/lib/formatos'
import { CabecalhoSite } from '@/components/site/cabecalho'
import { FormularioPreCadastro } from '@/components/site/formulario-pre-cadastro'
import {
  IconeAgenda,
  IconeBroto,
  IconeCheck,
  IconeConversa,
  IconeCoracao,
  IconeFolha,
  IconeGestacao,
  IconeMente,
  IconeWhatsapp,
} from '@/components/icones'

// Página estática: não consulta o banco, abre rápido no celular.
export const dynamic = 'force-static'

const AREAS = [
  {
    titulo: 'Gestação',
    Icone: IconeGestacao,
    cor: 'bg-terracota text-white',
    texto:
      'Um espaço para acolher as expectativas, os medos e as transformações da gravidez, inclusive quando ela não acontece como foi sonhada.',
  },
  {
    titulo: 'Puerpério',
    Icone: IconeCoracao,
    cor: 'bg-nude text-terracota-escuro',
    texto:
      'Os primeiros meses com o bebê trazem cansaço e mudanças no corpo, na rotina e nas relações. Cuidar de quem cuida também é essencial.',
  },
  {
    titulo: 'Parentalidade',
    Icone: IconeBroto,
    cor: 'bg-salvia text-white',
    texto:
      'Para mães, pais e cuidadores: os desafios de educar, a culpa, a divisão das tarefas, a volta ao trabalho e as relações familiares.',
  },
  {
    titulo: 'Saúde Mental',
    Icone: IconeMente,
    cor: 'bg-cacau text-white',
    texto:
      'Ansiedade, tristeza, sobrecarga, autoestima e outras questões emocionais da vida adulta, dentro ou fora da maternidade.',
  },
]

const SINAIS = [
  'Tristeza persistente',
  'Ansiedade excessiva',
  'Cansaço extremo',
  'Dificuldade de se conectar com o bebê',
  'Alterações no sono e no apetite',
]

const MODOS = [
  {
    titulo: 'Presencial',
    texto: `No consultório, em ${site.cidade}, num ambiente reservado e acolhedor.`,
  },
  {
    titulo: 'Online',
    texto: 'Por videochamada, de onde você estiver, com o mesmo sigilo do atendimento presencial.',
  },
  {
    titulo: 'Em domicílio',
    texto: 'A psicóloga vai até você. Ideal no puerpério, quando sair de casa com o bebê é difícil.',
  },
]

function Secao({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

export default function PaginaInicial() {
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <CabecalhoSite />

      <main id="conteudo">
        {/* ---------------------------------------------------------- INÍCIO */}
        <section id="inicio" className="relative overflow-hidden bg-gradient-to-br from-blush via-creme to-blush/70">
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cacau/15" />
          <div className="pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-nude/50" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-10 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pb-0 md:pt-16">
            <div className="md:pb-20">
              <p className="marca-texto text-sm text-terracota">
                {site.nome} <span className="text-terracota/60">|</span> {site.profissao}
              </p>
              <div className="linha-fina mt-4" />
              <h1 className="mt-6 font-serif text-[2.4rem] font-medium leading-[1.1] text-cacau sm:text-5xl lg:text-6xl">
                Cuidar da sua saúde mental também é parte da jornada <em className="font-normal text-terracota-escuro">da maternidade.</em>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-tinta/85">
                Você merece apoio, escuta e acolhimento em todas as fases.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#agende" className="btn-site">
                  Agende sua consulta
                </a>
                <a href="#areas" className="btn-site-claro">
                  Conheça as áreas de atuação
                </a>
              </div>
              <p className="mt-6 text-sm text-tinta/70">Presencial · Online · Em domicílio — {site.cidade}</p>
            </div>

            <div className="relative mx-auto w-56 sm:w-64 md:w-full md:max-w-sm md:self-end">
              <Image
                src="/img/gestante.png"
                alt="Ilustração em traço fino de uma mulher grávida acariciando a barriga"
                width={669}
                height={1539}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- ÁREAS */}
        <Secao id="areas">
          <div className="text-center">
            <p className="marca-texto text-xs text-terracota">Áreas de atuação</p>
            <h2 className="titulo-secao mt-3">Acolhimento em cada fase</h2>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map(({ titulo, Icone, cor, texto }) => (
              <li key={titulo} className="flex flex-col items-center rounded-3xl bg-white/60 px-6 pb-8 pt-8 text-center shadow-sm ring-1 ring-nude/60">
                <span className={`flex h-24 w-24 items-center justify-center rounded-full ring-4 ring-white ring-offset-2 ring-offset-nude ${cor}`}>
                  <Icone className="h-14 w-14" />
                </span>
                <h3 className="mt-5 font-serif text-2xl text-cacau">{titulo}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-tinta/85">{texto}</p>
              </li>
            ))}
          </ul>
        </Secao>

        {/* -------------------------------------------------- DESTAQUE */}
        <section className="bg-blush/70 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-[2rem] shadow-lg md:max-w-sm">
              <Image
                src="/img/maternidade.jpg"
                alt="Mãe sorrindo de olhos fechados enquanto abraça e beija o bebê, que ri"
                width={264}
                height={530}
                className="h-auto w-full"
                sizes="(min-width: 768px) 24rem, 20rem"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="font-serif text-4xl leading-tight text-cacau sm:text-5xl">A maternidade transforma.</p>
              <p className="mt-4 font-serif text-3xl italic leading-snug text-terracota-escuro sm:text-4xl">
                E você também merece ser acolhida.
              </p>
              <svg viewBox="0 0 200 30" className="mx-auto mt-6 h-8 w-48 text-terracota md:ml-auto md:mr-0" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M0 22c40 0 60-2 85-6M115 16c25 4 45 6 85 6" />
                <path d="M100 26s-10-6-10-12c0-3 2-5 5-5 2 0 4 2 5 4 1-2 3-4 5-4 3 0 5 2 5 5 0 6-10 12-10 12z" />
              </svg>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- SINAIS */}
        <Secao id="sinais">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush to-creme px-6 py-12 shadow-sm ring-1 ring-nude/60 sm:px-12">
            <IconeFolha className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 text-salvia/70" />
            <p className="marca-texto text-xs text-terracota">Informação que cuida</p>
            <h2 className="titulo-secao mt-3 max-w-md">Pós-parto: alguns sinais que merecem atenção</h2>
            <ul className="mt-8 space-y-3">
              {SINAIS.map((s) => (
                <li key={s} className="flex items-start gap-3 text-lg text-tinta">
                  <IconeCheck className="mt-1 h-5 w-5 shrink-0 text-terracota" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[0.95rem] leading-relaxed text-tinta/85">
              Choro e oscilação de humor nos primeiros dias depois do parto são comuns (o chamado <em>baby blues</em>). Quando os
              sinais duram mais de duas semanas ou atrapalham o dia a dia, é importante buscar ajuda.
            </p>
            <p className="mt-6 rounded-2xl bg-nude/70 px-5 py-4 text-center font-serif text-xl text-cacau">
              Se você se identifica, procure um profissional de confiança.
            </p>
          </div>
        </Secao>

        {/* ----------------------------------------------- ATENDIMENTO */}
        <Secao id="atendimento" className="bg-white/50">
          <div className="text-center">
            <p className="marca-texto text-xs text-terracota">Como funciona</p>
            <h2 className="titulo-secao mt-3">Atendimento do jeito que cabe na sua rotina</h2>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {MODOS.map((m) => (
              <li key={m.titulo} className="rounded-3xl border border-nude bg-creme p-7">
                <h3 className="font-serif text-2xl text-cacau">{m.titulo}</h3>
                <div className="linha-fina mt-3 !w-12" />
                <p className="mt-4 leading-relaxed text-tinta/85">{m.texto}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[0.95rem] leading-relaxed text-tinta/80">
            Tudo o que é conversado nas sessões é protegido pelo sigilo profissional previsto no Código de Ética do Psicólogo.
          </p>
        </Secao>

        {/* -------------------------------------------------- SOBRE */}
        <Secao id="sobre">
          <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
            <div className="relative mx-auto w-64 sm:w-72 md:w-80">
              {/* moldura em arco, com um "eco" deslocado no tom nude */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-full rounded-b-[2rem] bg-nude" aria-hidden="true" />
              <Image
                src="/img/erika.jpg"
                alt={`${site.nome}, psicóloga, sorrindo, sentada perto de uma janela com cortina clara`}
                width={800}
                height={1000}
                sizes="(min-width: 768px) 20rem, 16rem"
                className="relative h-auto w-full rounded-t-full rounded-b-[2rem] object-cover shadow-md"
              />
              <IconeFolha className="absolute -bottom-6 -left-6 h-20 w-20 text-salvia" />
            </div>
            <div>
              <p className="marca-texto text-xs text-terracota">
                <IconeConversa className="mr-2 inline h-5 w-5 align-[-4px]" />
                Sobre mim
              </p>
              <h2 className="titulo-secao mt-3">Olá, eu sou a {site.nome}</h2>
              <div className="mt-6 space-y-4 text-[1.02rem] leading-relaxed text-tinta/90">
                <p>
                  Sou psicóloga ({site.crp}) e acompanho mulheres, mães, pais e famílias em um dos períodos de maior transformação
                  da vida: a chegada de um filho, com tudo o que vem antes e depois dela.
                </p>
                <p>
                  Acredito que cuidar da saúde emocional não é luxo, nem sinal de fraqueza. É uma forma de cuidar de você e de quem
                  você ama. Meu trabalho é oferecer um espaço de escuta atenta, ética e sem julgamentos, para que você possa falar do
                  que sente no seu tempo.
                </p>
              </div>
              <p className="mt-6 text-sm text-tinta/70">
                {site.nomeCompleto} · {site.profissao} · {site.crp}
              </p>
            </div>
          </div>
        </Secao>

        {/* -------------------------------------------------- AGENDE */}
        <Secao id="agende" className="bg-gradient-to-b from-blush/80 to-creme">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-terracota text-white ring-4 ring-white">
                <IconeAgenda className="h-10 w-10" />
              </span>
              <h2 className="titulo-secao mt-6">Agende sua consulta</h2>
              <p className="mt-4 text-lg leading-relaxed text-tinta/85">
                Preencha o formulário e eu entro em contato para conversarmos sobre horários, valores e a modalidade de atendimento
                que fica melhor para você.
              </p>
              <ul className="mt-6 space-y-3 text-tinta/90">
                {site.whatsapp && (
                  <li>
                    <a
                      href={linkWhatsapp(site.whatsapp, 'Olá, Érika! Vim pelo site e gostaria de agendar uma consulta.')}
                      className="btn-site"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconeWhatsapp /> Falar pelo WhatsApp
                    </a>
                  </li>
                )}
                {site.instagram && (
                  <li>
                    Instagram:{' '}
                    <a href={`https://instagram.com/${site.instagram}`} className="text-terracota-escuro underline" target="_blank" rel="noopener noreferrer">
                      @{site.instagram}
                    </a>
                  </li>
                )}
                {site.email && (
                  <li>
                    E-mail:{' '}
                    <a href={`mailto:${site.email}`} className="text-terracota-escuro underline">
                      {site.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-nude/70 sm:p-8">
              <FormularioPreCadastro />
            </div>
          </div>
        </Secao>
      </main>

      {/* -------------------------------------------------- RODAPÉ */}
      <footer className="border-t border-nude bg-blush/60 px-4 py-10 text-center sm:px-6">
        <Image src="/img/logo.png" alt="" width={72} height={72} className="mx-auto h-[72px] w-[72px]" />
        <p className="marca-texto mt-4 text-sm text-cacau">{site.nome}</p>
        <p className="mt-1 text-sm text-tinta/80">
          {site.profissao} · {site.crp} · {site.cidade}
        </p>
        <p className="mx-auto mt-6 max-w-xl rounded-2xl bg-white/60 px-4 py-3 text-sm text-tinta/85">
          Este site não oferece atendimento de urgência. Em caso de crise ou risco à vida, ligue <strong>188</strong> (CVV, gratuito,
          24 horas) ou <strong>192</strong> (SAMU).
        </p>
        <p className="mt-6 flex justify-center gap-5 text-xs text-tinta/60">
          <Link href="/privacidade" className="hover:text-terracota">
            Política de privacidade
          </Link>
          <Link href="/sistema" className="hover:text-terracota" prefetch={false}>
            Área restrita
          </Link>
        </p>
      </footer>
    </>
  )
}
