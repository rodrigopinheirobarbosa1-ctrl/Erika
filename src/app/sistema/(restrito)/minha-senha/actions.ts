'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { conferirSenha, exigirUsuarioAction, hashSenha } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import type { EstadoForm } from '@/components/form'

const esquema = z.object({
  atual: z.string().min(1, 'Informe a senha atual.'),
  nova: z.string().min(10, 'A nova senha precisa ter pelo menos 10 caracteres.'),
  confirmacao: z.string(),
})

export async function trocarSenha(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioAction()
  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  if (r.data.nova !== r.data.confirmacao) return { erro: 'As duas senhas novas não são iguais.' }

  const registro = await db.usuario.findUniqueOrThrow({ where: { id: usuario.id } })
  if (!(await conferirSenha(r.data.atual, registro.senhaHash))) return { erro: 'Senha atual incorreta.' }

  await db.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await hashSenha(r.data.nova) } })
  await auditar({ usuario, acao: 'SENHA', entidade: 'Usuario', entidadeId: usuario.id, resumo: `${usuario.nome} trocou a própria senha` })
  return { ok: 'Senha trocada com sucesso.' }
}
