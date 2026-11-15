import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Texto } from '@/components/campos'
import { MarcaSistema } from '@/components/marca-sistema'
import { criarPrimeiroAdmin } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Primeiro acesso | Área restrita', robots: { index: false } }

export default async function PrimeiroAcesso() {
  if ((await db.usuario.count()) > 0) redirect('/sistema/login')

  return (
    <main className="flex min-h-screen items-center justify-center bg-blush/50 px-4 py-10">
      <div className="w-full max-w-sm">
        <MarcaSistema subtitulo="Bem-vinda! Crie o seu acesso." />
        <div className="cartao p-6">
          <p className="mb-4 text-sm text-stone-600">
            Esta tela só aparece uma vez, enquanto o sistema não tem nenhum usuário. Quem criar este acesso será a administradora.
          </p>
          <Formulario action={criarPrimeiroAdmin} className="space-y-4">
            <Texto rotulo="Seu nome" nome="nome" obrigatorio />
            <Texto rotulo="E-mail" nome="email" tipo="email" obrigatorio />
            <Texto rotulo="Senha" nome="senha" tipo="password" obrigatorio dica="Pelo menos 10 caracteres." />
            <Texto rotulo="Repita a senha" nome="confirmacao" tipo="password" obrigatorio />
            <Texto
              rotulo="Chave de instalação"
              nome="chaveInstalacao"
              tipo="password"
              obrigatorio
              dica="É a frase cadastrada como SESSION_SECRET na Vercel. Protege esta tela de estranhos."
            />
            <BotaoEnviar>Criar acesso</BotaoEnviar>
          </Formulario>
        </div>
      </div>
    </main>
  )
}
