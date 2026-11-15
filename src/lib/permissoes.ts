// Quem pode ver o quê. Código puro (testado em testes/permissoes.test.ts).
//
// Sigilo profissional (Código de Ética do Psicólogo; Resolução CFP 001/2009):
// os textos clínicos (queixa, motivo da procura, anotações) são só da
// psicóloga. O suporte técnico administra acessos, mas não vê pacientes.

export type Papel = 'ADMIN' | 'ASSISTENTE' | 'SUPORTE'

export const PAPEIS: Record<Papel, { nome: string; descricao: string }> = {
  ADMIN: { nome: 'Psicóloga (administradora)', descricao: 'Acesso a tudo, inclusive textos clínicos e histórico.' },
  ASSISTENTE: { nome: 'Secretária(o)', descricao: 'Pedidos de contato e cadastro dos pacientes, sem textos clínicos.' },
  SUPORTE: { nome: 'Suporte técnico', descricao: 'Cria usuários e redefine senhas. Não vê pacientes.' },
}

export const ehPapel = (v: unknown): v is Papel => typeof v === 'string' && v in PAPEIS

/** Pedidos de contato e cadastro de pacientes. */
export const vePacientes = (p: Papel) => p === 'ADMIN' || p === 'ASSISTENTE'
/** Queixa, motivo da procura, observações e anotações (criptografados). */
export const veClinico = (p: Papel) => p === 'ADMIN'
/** Histórico de acessos (cita nomes de pacientes). */
export const veHistorico = (p: Papel) => p === 'ADMIN'
/** Tela de usuários. */
export const gereUsuarios = (p: Papel) => p === 'ADMIN' || p === 'SUPORTE'

/**
 * Quem pode dar qual perfil. O suporte não cria nem promove administradora:
 * senão bastaria criar um login de administradora para ver os pacientes.
 */
export function podeAtribuir(quem: Papel, papel: Papel): boolean {
  if (quem === 'ADMIN') return true
  if (quem === 'SUPORTE') return papel !== 'ADMIN'
  return false
}

/** O suporte não mexe em contas de administradora (só redefine a senha, se pedido). */
export function podeEditar(quem: Papel, alvo: Papel): boolean {
  if (quem === 'ADMIN') return true
  if (quem === 'SUPORTE') return alvo !== 'ADMIN'
  return false
}
