'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirGestorUsuariosAction, hashSenha } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { PAPEIS, ehPapel, podeAtribuir, podeEditar } from '@/lib/permissoes'
import type { EstadoForm } from '@/components/form'

const MINIMO_SENHA = 10

const dadosBasicos = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  papel: z.string().refine(ehPapel, 'Escolha o perfil.'),
})

export async function criarUsuario(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const quem = await exigirGestorUsuariosAction()
  const r = dadosBasicos.extend({ senha: z.string() }).safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const { nome, email, senha } = r.data
  const papel = r.data.papel as keyof typeof PAPEIS
  if (senha.length < MINIMO_SENHA) return { erro: `A senha inicial precisa ter pelo menos ${MINIMO_SENHA} caracteres.` }
  if (!podeAtribuir(quem.papel, papel)) return { erro: 'Só a psicóloga (administradora) pode criar outra administradora.' }
  if (await db.usuario.findUnique({ where: { email } })) return { erro: 'Já existe um usuário com esse e-mail.' }

  const novo = await db.usuario.create({ data: { nome, email, papel, senhaHash: await hashSenha(senha) } })
  await auditar({
    usuario: quem,
    acao: 'CRIAR',
    entidade: 'Usuario',
    entidadeId: novo.id,
    resumo: `Criou o usuário ${nome} (${email}) como ${PAPEIS[papel].nome}`,
  })
  revalidatePath('/sistema/usuarios')
  return { ok: `Usuário ${nome} criado. Passe o e-mail e a senha inicial a essa pessoa com segurança; ela pode trocar a senha em "Minha senha".` }
}

export async function alterarUsuario(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const quem = await exigirGestorUsuariosAction()
  const r = dadosBasicos.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const { nome, email } = r.data
  const papel = r.data.papel as keyof typeof PAPEIS
  const ativo = dados.get('ativo') === 'on'

  const alvo = await db.usuario.findUnique({ where: { id } })
  if (!alvo) return { erro: 'Usuário não encontrado.' }
  if (!podeEditar(quem.papel, alvo.papel)) return { erro: 'Só a psicóloga (administradora) pode alterar uma conta de administradora.' }
  if (papel !== alvo.papel && !podeAtribuir(quem.papel, papel)) return { erro: 'Só a psicóloga (administradora) pode dar o perfil de administradora.' }
  if (email !== alvo.email && (await db.usuario.findUnique({ where: { email } }))) return { erro: 'Já existe outro usuário com esse e-mail.' }

  // O consultório nunca pode ficar sem nenhuma administradora ativa.
  if (alvo.papel === 'ADMIN' && (papel !== 'ADMIN' || !ativo)) {
    const outras = await db.usuario.count({ where: { papel: 'ADMIN', ativo: true, id: { not: id } } })
    if (outras === 0) return { erro: 'Esta é a última administradora ativa. Crie ou promova outra antes de alterar esta.' }
  }

  await db.usuario.update({ where: { id }, data: { nome, email, papel, ativo } })
  // Conta desativada: as sessões abertas deixam de valer. (O perfil não exige
  // isso: ele é relido do banco a cada acesso, então a mudança vale na hora.)
  if (!ativo) await db.sessao.deleteMany({ where: { usuarioId: id } })

  const mudancas = [
    nome !== alvo.nome && `nome`,
    email !== alvo.email && `e-mail para ${email}`,
    papel !== alvo.papel && `perfil de ${PAPEIS[alvo.papel].nome} para ${PAPEIS[papel].nome}`,
    ativo !== alvo.ativo && (ativo ? 'reativou' : 'desativou'),
  ].filter(Boolean)
  await auditar({
    usuario: quem,
    acao: 'ALTERAR',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `Alterou o usuário ${alvo.nome}${mudancas.length ? ` (${mudancas.join(', ')})` : ''}`,
  })
  revalidatePath('/sistema/usuarios')
  revalidatePath('/sistema', 'layout')
  return {
    ok:
      id === quem.id && papel !== alvo.papel
        ? `Seu perfil agora é ${PAPEIS[papel].nome}. O menu já mostra só o que esse perfil acessa.`
        : 'Usuário atualizado.',
  }
}

export async function redefinirSenha(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const quem = await exigirGestorUsuariosAction()
  const senha = String(dados.get('novaSenha') ?? '')
  if (senha.length < MINIMO_SENHA) return { erro: `A nova senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.` }
  const alvo = await db.usuario.findUnique({ where: { id } })
  if (!alvo) return { erro: 'Usuário não encontrado.' }

  await db.usuario.update({ where: { id }, data: { senhaHash: await hashSenha(senha) } })
  await db.sessao.deleteMany({ where: { usuarioId: id } }) // quem entrou com a senha antiga sai
  await auditar({ usuario: quem, acao: 'SENHA', entidade: 'Usuario', entidadeId: id, resumo: `Redefiniu a senha de ${alvo.nome}` })
  revalidatePath('/sistema/usuarios')
  return { ok: `Senha de ${alvo.nome} redefinida. Passe a nova senha com segurança.` }
}
