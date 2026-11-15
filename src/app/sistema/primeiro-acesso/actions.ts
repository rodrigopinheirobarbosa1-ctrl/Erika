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

/**
 * Deixa a frase comparável: tira espaços nas pontas, aspas em volta (comuns
 * ao colar na Vercel) e troca aspas "curvas" do celular pelas retas.
 */
function normalizar(t: string): string {
  let v = t.normalize('NFC').replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").trim()
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) v = v.slice(1, -1).trim()
  return v
}

/** Compara sem revelar, pelo tempo de resposta, quantas letras acertaram. */
function iguais(a: string, b: string): boolean {
  const resumo = (t: string) => createHash('sha256').update(normalizar(t)).digest()
  return timingSafeEqual(resumo(a), resumo(b))
}

/** Explica o erro sem revelar a chave (só o tamanho, que não ajuda a adivinhá-la). */
function motivoDoErro(digitada: string): string {
  if (iguais(digitada, process.env.CHAVE_CRIPTOGRAFIA ?? '')) {
    return 'Essa é a CHAVE_CRIPTOGRAFIA (a frase 2). Aqui vai a SESSION_SECRET (a frase 1).'
  }
  const esperado = normalizar(chaveDasSessoes()).length
  const recebido = normalizar(digitada).length
  const tamanho =
    esperado === recebido
      ? `O tamanho está certo (${esperado} caracteres): confira maiúsculas/minúsculas, hífens e números.`
      : `Você digitou ${recebido} caracteres, mas a chave cadastrada na Vercel tem ${esperado}.`
  return `Chave de instalação incorreta (é o valor de SESSION_SECRET na Vercel). ${tamanho}`
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
  if (!iguais(r.data.chaveInstalacao, chaveDasSessoes())) return { erro: motivoDoErro(r.data.chaveInstalacao) }

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
