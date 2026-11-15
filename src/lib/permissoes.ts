// Quem pode ver o quê. Código puro (testado em testes/permissoes.test.ts).
//
// Sigilo profissional (Código de Ética do Psicólogo; Resolução CFP 001/2009):
// os textos clínicos (queixa, motivo da procura, anotações) são da psicóloga.
// Exceção combinada: UM administrador do sistema (TOTAL), quem mantém o app,
// vê tudo — com a psicóloga sabendo (aviso na tela de usuários), podendo
// desativá-lo, e com todo acesso registrado no histórico.

export type Papel = 'ADMIN' | 'TOTAL' | 'ASSISTENTE' | 'SUPORTE'

export const PAPEIS: Record<Papel, { nome: string; descricao: string }> = {
  ADMIN: { nome: 'Psicóloga (administradora)', descricao: 'Acesso a tudo, inclusive textos clínicos e histórico.' },
  TOTAL: {
    nome: 'Administrador do sistema',
    descricao: 'Quem mantém o sistema: acesso a tudo, inclusive textos clínicos. Só um por vez; a psicóloga vê e pode desativar.',
  },
  ASSISTENTE: { nome: 'Secretária(o)', descricao: 'Pedidos de contato e cadastro dos pacientes, sem textos clínicos.' },
  SUPORTE: { nome: 'Suporte técnico', descricao: 'Cria usuários e redefine senhas. Não vê pacientes.' },
}

export const ehPapel = (v: unknown): v is Papel => typeof v === 'string' && v in PAPEIS

/** Psicóloga ou administrador do sistema. */
export const acessoTotal = (p: Papel) => p === 'ADMIN' || p === 'TOTAL'

/** Pedidos de contato e cadastro de pacientes. */
export const vePacientes = (p: Papel) => acessoTotal(p) || p === 'ASSISTENTE'
/** Queixa, motivo da procura, observações e anotações (criptografados). */
export const veClinico = (p: Papel) => acessoTotal(p)
/** Histórico de acessos (cita nomes de pacientes). */
export const veHistorico = (p: Papel) => acessoTotal(p)
/** Tela de usuários. */
export const gereUsuarios = (p: Papel) => acessoTotal(p) || p === 'SUPORTE'

/**
 * Quem pode dar qual perfil. O suporte não dá perfis de acesso total:
 * senão bastaria criar um desses logins para ver os pacientes.
 */
export function podeAtribuir(quem: Papel, papel: Papel): boolean {
  if (acessoTotal(quem)) return true
  if (quem === 'SUPORTE') return !acessoTotal(papel)
  return false
}

/** O suporte não mexe em contas de acesso total (só redefine a senha, se pedido). */
export function podeEditar(quem: Papel, alvo: Papel): boolean {
  if (acessoTotal(quem)) return true
  if (quem === 'SUPORTE') return !acessoTotal(alvo)
  return false
}
