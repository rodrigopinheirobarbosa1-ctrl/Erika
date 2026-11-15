import 'server-only'
import { db } from './db'
import type { UsuarioLogado } from './auth'

/**
 * Registra no histórico quem fez o quê e quando. Para dados de saúde isso
 * inclui quem ABRIU a ficha de um paciente (acao VISUALIZAR).
 */
export async function auditar(registro: {
  usuario: UsuarioLogado
  acao: 'CRIAR' | 'ALTERAR' | 'VISUALIZAR' | 'LOGIN' | 'PRIMEIRO_ACESSO' | 'SENHA'
  entidade: string
  entidadeId?: string | null
  resumo: string
}): Promise<void> {
  await db.auditoria.create({
    data: {
      usuarioId: registro.usuario.id || null,
      usuarioNome: registro.usuario.nome,
      acao: registro.acao,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId ?? null,
      resumo: registro.resumo,
    },
  })
}
