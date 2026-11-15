import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { veHistorico } from '@/lib/permissoes'
import { formatarDataHora } from '@/lib/formatos'
import { Cabecalho, Cartao, Tabela, Td, Th, Vazio } from '@/components/ui'

const ACOES: Record<string, string> = {
  CRIAR: 'Criou',
  ALTERAR: 'Alterou',
  VISUALIZAR: 'Abriu',
  LOGIN: 'Entrou',
  PRIMEIRO_ACESSO: 'Primeiro acesso',
  SENHA: 'Senha',
}

export default async function Historico() {
  const usuario = await exigirUsuario()
  if (!veHistorico(usuario.papel)) redirect('/sistema')
  const registros = await db.auditoria.findMany({ orderBy: { criadoEm: 'desc' }, take: 300 })
  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho titulo="Histórico de acessos" descricao="Quem entrou, abriu ou alterou cada informação (últimos 300 registros)." />
      <Cartao>
        {registros.length === 0 ? (
          <Vazio texto="Nada registrado ainda." />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Quando</Th>
                <Th>Quem</Th>
                <Th>Ação</Th>
                <Th>Detalhe</Th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-stone-500">{formatarDataHora(r.criadoEm)}</Td>
                  <Td>{r.usuarioNome}</Td>
                  <Td>{ACOES[r.acao] ?? r.acao}</Td>
                  <Td>{r.resumo}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </div>
  )
}
