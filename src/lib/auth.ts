import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHmac, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { gereUsuarios, veClinico, veFinanceiro, vePacientes, type Papel } from './permissoes'

// Mesmo modelo de login do Mathima.
const COOKIE = 'erika_sessao'
const DURACAO_DIAS = 1 // dados de saúde: sessão curta (1 dia)

/**
 * A chave que protege as sessões (SESSION_SECRET).
 *
 * O cookie guarda um código aleatório; o banco guarda só uma "impressão
 * digital" desse código, calculada com esta chave. Quem conseguir ler a tabela
 * de sessões (num backup esquecido, por exemplo) não consegue montar um cookie
 * válido a partir dela. Trocar a chave desconecta todo mundo.
 */
export function chaveDasSessoes(): string {
  const chave = process.env.SESSION_SECRET ?? ''
  if (chave.length >= 32 && !chave.startsWith('troque-por')) return chave
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET ausente ou curta demais (mínimo 32 caracteres). Na Vercel: Settings > Environment Variables.')
  }
  return 'chave-de-desenvolvimento-local-nao-use-na-internet'
}

function idDaSessao(codigo: string): string {
  return createHmac('sha256', chaveDasSessoes()).update(codigo).digest('hex')
}

/** Endereço de quem fez a requisição (na Vercel, o x-forwarded-for é escrito pela plataforma). */
export function ipDaRequisicao(cabecalhos: Headers): string | null {
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || cabecalhos.get('x-real-ip')?.trim() || null
}

export type UsuarioLogado = {
  id: string
  nome: string
  email: string
  papel: Papel
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

/** Cria a sessão de um usuário já autenticado e grava o cookie. */
export async function abrirSessao(usuarioId: string): Promise<void> {
  const codigo = randomBytes(32).toString('hex')
  const expiraEm = new Date(Date.now() + DURACAO_DIAS * 86400000)

  await db.sessao.create({
    data: { id: idDaSessao(codigo), usuarioId, expiraEm, ip: ipDaRequisicao(await headers()) },
  })
  await db.usuario.update({ where: { id: usuarioId }, data: { ultimoAcesso: new Date() } })

  const jarra = await cookies()
  jarra.set(COOKIE, codigo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiraEm,
  })
}

/**
 * Autentica e cria a sessão. Devolve null quando as credenciais não conferem
 * (mensagem genérica de propósito: não revela se o e-mail existe).
 */
export async function entrar(email: string, senha: string): Promise<UsuarioLogado | null> {
  const usuario = await db.usuario.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!usuario || !usuario.ativo) {
    await bcrypt.compare(senha, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin')
    return null
  }
  if (!(await conferirSenha(senha, usuario.senhaHash))) return null

  await abrirSessao(usuario.id)
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
}

export async function sair(): Promise<void> {
  const jarra = await cookies()
  const codigo = jarra.get(COOKIE)?.value
  if (codigo) await db.sessao.deleteMany({ where: { id: idDaSessao(codigo) } })
  jarra.delete(COOKIE)
}

/** Usuário da requisição atual, ou null se não houver sessão válida. */
export async function usuarioAtual(): Promise<UsuarioLogado | null> {
  const codigo = (await cookies()).get(COOKIE)?.value
  if (!codigo) return null

  const id = idDaSessao(codigo)
  const sessao = await db.sessao.findUnique({ where: { id }, include: { usuario: true } })
  if (!sessao || sessao.expiraEm < new Date() || !sessao.usuario.ativo) {
    if (sessao) await db.sessao.deleteMany({ where: { id } })
    return null
  }
  const u = sessao.usuario
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel }
}

export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/sistema/login')
  return usuario
}

export async function exigirAdmin(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (usuario.papel !== 'ADMIN') redirect('/sistema')
  return usuario
}

/** Usado dentro de server actions: lança erro em vez de redirecionar. */
export async function exigirUsuarioAction(): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual()
  if (!usuario) throw new Error('Sessão expirada. Entre novamente.')
  return usuario
}

export async function exigirAdminAction(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuarioAction()
  if (usuario.papel !== 'ADMIN') throw new Error('Seu perfil não tem permissão para esta operação.')
  return usuario
}

/** Telas de pacientes e pedidos de contato (psicóloga e secretária). */
export async function exigirAcessoPacientes(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (!vePacientes(usuario.papel)) redirect('/sistema')
  return usuario
}

export async function exigirAcessoPacientesAction(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuarioAction()
  if (!vePacientes(usuario.papel)) throw new Error('Seu perfil não tem acesso aos pacientes.')
  return usuario
}

/** A pessoa logada pode ver os textos clínicos? */
export const podeVerClinico = (u: UsuarioLogado) => veClinico(u.papel)

/** Tela de usuários (psicóloga e suporte técnico). */
export async function exigirGestorUsuarios(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (!gereUsuarios(usuario.papel)) redirect('/sistema')
  return usuario
}

export async function exigirGestorUsuariosAction(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuarioAction()
  if (!gereUsuarios(usuario.papel)) throw new Error('Seu perfil não tem permissão para gerenciar usuários.')
  return usuario
}

/** Resumo, despesas e relatórios financeiros (psicóloga e administrador do sistema). */
export async function exigirFinanceiro(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (!veFinanceiro(usuario.papel)) redirect('/sistema')
  return usuario
}

export async function exigirFinanceiroAction(): Promise<UsuarioLogado> {
  const usuario = await exigirUsuarioAction()
  if (!veFinanceiro(usuario.papel)) throw new Error('Seu perfil não tem acesso ao financeiro.')
  return usuario
}

export async function limparSessoesVencidas(): Promise<void> {
  await db.sessao.deleteMany({ where: { expiraEm: { lt: new Date() } } })
}
