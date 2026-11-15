import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { db } from '@/lib/db'
import { BotaoEnviar, Formulario } from '@/components/form'
import { MarcaSistema } from '@/components/marca-sistema'
import { acaoEntrar } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Entrar | Área restrita', robots: { index: false } }

export default async function PaginaLogin() {
  if (await usuarioAtual()) redirect('/sistema')
  if ((await db.usuario.count()) === 0) redirect('/sistema/primeiro-acesso')

  return (
    <main className="flex min-h-screen items-center justify-center bg-blush/50 px-4 py-10">
      <div className="w-full max-w-sm">
        <MarcaSistema subtitulo="Área restrita do consultório" />
        <div className="cartao p-6">
          <Formulario action={acaoEntrar}>
            <label className="block">
              <span className="rotulo">E-mail</span>
              <input type="email" name="email" required autoComplete="username" autoFocus className="campo" />
            </label>
            <label className="mt-4 block">
              <span className="rotulo">Senha</span>
              <input type="password" name="senha" required autoComplete="current-password" className="campo" />
            </label>
            <div className="mt-6">
              <BotaoEnviar>Entrar</BotaoEnviar>
            </div>
          </Formulario>
        </div>
        <p className="mt-6 text-center text-xs text-stone-500">
          <Link href="/" className="underline">
            Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  )
}
