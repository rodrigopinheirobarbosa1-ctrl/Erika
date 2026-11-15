import type { Metadata } from 'next'
import { exigirUsuario } from '@/lib/auth'
import { db } from '@/lib/db'
import { Menu } from '@/components/menu'
import { lembretesAgora } from '@/lib/mensagens-servidor'
import { vePacientes } from '@/lib/permissoes'

export const metadata: Metadata = { title: 'Consultório | Érika Dias', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

// Toda tela dentro deste grupo exige usuário autenticado.
export default async function LayoutRestrito({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario()
  const novosPedidos = vePacientes(usuario.papel) ? await db.preCadastro.count({ where: { status: 'NOVO' } }) : 0
  const lembretes = vePacientes(usuario.papel) ? (await lembretesAgora()).length : 0

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 lg:flex-row">
      <Menu usuario={usuario} novosPedidos={novosPedidos} lembretes={lembretes} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
