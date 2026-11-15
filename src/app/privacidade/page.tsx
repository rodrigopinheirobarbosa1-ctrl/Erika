import Link from 'next/link'
import type { Metadata } from 'next'
import { site } from '@/lib/site'

export const metadata: Metadata = { title: `Política de privacidade | ${site.nome} · ${site.profissao}` }
export const dynamic = 'force-static'

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm text-terracota-escuro underline underline-offset-2">
        ← Voltar ao site
      </Link>
      <h1 className="titulo-secao mt-6">Política de privacidade</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-tinta/90">
        <p>
          Este site pertence a {site.nomeCompleto}, {site.profissao.toLowerCase()} ({site.crp}), responsável pelo tratamento dos dados
          pessoais aqui coletados, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
        <h2 className="pt-2 font-serif text-2xl text-cacau">Quais dados coletamos</h2>
        <p>
          No formulário “Agende sua consulta”: nome, telefone, e-mail (opcional), preferências de atendimento e, se você quiser
          escrever, um breve relato do motivo da procura.
        </p>
        <h2 className="pt-2 font-serif text-2xl text-cacau">Para que usamos</h2>
        <p>
          Exclusivamente para entrar em contato com você sobre o atendimento psicológico solicitado. Os dados não são vendidos nem
          compartilhados com terceiros, nem usados para propaganda.
        </p>
        <h2 className="pt-2 font-serif text-2xl text-cacau">Como protegemos</h2>
        <p>
          O acesso é restrito à psicóloga, com senha. Os relatos sobre o motivo da procura são gravados de forma criptografada. As
          informações obtidas no atendimento são protegidas pelo sigilo profissional (Código de Ética Profissional do Psicólogo).
        </p>
        <h2 className="pt-2 font-serif text-2xl text-cacau">Por quanto tempo</h2>
        <p>
          Pedidos de contato que não viram atendimento podem ser excluídos a qualquer momento, a seu pedido. Quando há atendimento, os
          registros são guardados pelo prazo mínimo exigido pelo Conselho Federal de Psicologia (Resolução CFP nº 001/2009).
        </p>
        <h2 className="pt-2 font-serif text-2xl text-cacau">Seus direitos</h2>
        <p>
          Você pode pedir a qualquer momento para ver, corrigir ou excluir seus dados, ou retirar seu consentimento, falando
          diretamente com a psicóloga pelos canais de contato do site.
        </p>
      </div>
    </main>
  )
}
