'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createHash, timingSafeEqual } from 'node:crypto'
import { abrirSessao, chaveDasSessoes, hashSenha } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import type { EstadoForm } from '@/components/form'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe o seu nome.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  senha: z.string().min(10, 'A senha precisa ter pelo menos 10 caracteres.'),
  confirmacao: z.string(),
  chaveInstalacao: z.string().min(1, 'Informe a chave de instalação (SESSION_SECRET).'),
})

/** Compara sem revelar, pelo tempo de resposta, quantas letras acertaram. */
function mesmaChave(digitada: string): boolean {
  const resumo = (t: string) => createHash('sha256').update(t).digest()
  return timingSafeEqual(resumo(digitada.trim()), resumo(chaveDasSessoes()))
}

/**
 * Cria o primeiro administrador. Só funciona enquanto não existe nenhum
 * usuário, e só para quem souber a chave de instalação (SESSION_SECRET).
 */
export async function criarPrimeiroAdmin(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  if (r.data.senha !== r.data.confirmacao) return { erro: 'As duas senhas não são iguais.' }
  // Sem isto, qualquer pessoa que abrisse o site logo após a publicação
  // poderia virar administradora. Só quem configurou a Vercel conhece a chave.
  if (!mesmaChave(r.data.chaveInstalacao)) return { erro: 'Chave de instalação incorreta. É o valor de SESSION_SECRET na Vercel.' }

  const senhaHash = await hashSenha(r.data.senha)
  // Dentro de uma transação, para duas pessoas não virarem admin ao mesmo tempo.
  const usuario = await db.$transaction(async (tx) => {
    if ((await tx.usuario.count()) > 0) return null
    return tx.usuario.create({ data: { nome: r.data.nome, email: r.data.email, senhaHash, papel: 'ADMIN' } })
  })
  if (!usuario) return { erro: 'O sistema já tem um administrador. Entre pela tela de login.' }

  await abrirSessao(usuario.id)
  await auditar({
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: 'ADMIN' },
    acao: 'PRIMEIRO_ACESSO',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    resumo: `${usuario.nome} criou o primeiro acesso de administrador`,
  })
  redirect('/sistema')
}
