import { db } from '@/lib/db'
import { exigirGestorUsuarios } from '@/lib/auth'
import { formatarDataHora } from '@/lib/formatos'
import { PAPEIS, podeAtribuir, podeEditar, type Papel } from '@/lib/permissoes'
import { Aviso, Cabecalho, Cartao, Etiqueta } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { alterarUsuario, criarUsuario, redefinirSenha } from './actions'

export default async function Usuarios() {
  const quem = await exigirGestorUsuarios()
  const usuarios = await db.usuario.findMany({ orderBy: [{ ativo: 'desc' }, { nome: 'asc' }] })
  const opcoesPara = (atual?: Papel) =>
    (Object.keys(PAPEIS) as Papel[])
      .filter((p) => p === atual || podeAtribuir(quem.papel, p))
      .map((p) => ({ valor: p, texto: PAPEIS[p].nome }))

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Usuários" descricao="Quem pode entrar no sistema do consultório." />

      <div className="mb-5 space-y-2">
        <Aviso>
          <ul className="space-y-1">
            {(Object.keys(PAPEIS) as Papel[]).map((p) => (
              <li key={p}>
                <strong>{PAPEIS[p].nome}:</strong> {PAPEIS[p].descricao}
              </li>
            ))}
          </ul>
        </Aviso>
        {quem.papel === 'ADMIN' && !usuarios.some((u) => u.papel === 'TOTAL') && usuarios.length === 1 && (
          <Aviso tom="amarelo">
            Se quem está configurando o sistema não é a psicóloga: crie o acesso dela como{' '}
            <strong>Psicóloga (administradora)</strong> e depois mude o seu perfil para <strong>Administrador do sistema</strong> ou{' '}
            <strong>Suporte técnico</strong>.
          </Aviso>
        )}
        {usuarios
          .filter((u) => u.papel === 'TOTAL' && u.ativo)
          .map((u) => (
            <Aviso key={u.id} tom="amarelo">
              <strong>{u.nome}</strong> é o administrador do sistema: tem acesso a tudo, <strong>inclusive aos textos clínicos</strong>.
              Toda ficha aberta fica no Histórico de acessos. A psicóloga pode desativar esta conta a qualquer momento.
            </Aviso>
          ))}
      </div>

      <div className="space-y-4">
        {usuarios.map((u) => {
          const editavel = podeEditar(quem.papel, u.papel)
          return (
            <Cartao
              key={u.id}
              titulo={`${u.nome}${u.id === quem.id ? ' (você)' : ''}`}
              acao={
                <span className="flex gap-1.5">
                  {!u.ativo && <Etiqueta tom="cinza">Desativado</Etiqueta>}
                  <Etiqueta tom={u.papel === 'ADMIN' ? 'azul' : u.papel === 'TOTAL' ? 'vermelho' : u.papel === 'SUPORTE' ? 'roxo' : 'verde'}>{PAPEIS[u.papel].nome}</Etiqueta>
                </span>
              }
            >
              <p className="mb-3 text-xs text-stone-500">
                {u.email} · último acesso: {u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : 'nunca entrou'}
              </p>
              {editavel ? (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-marca-700">Alterar dados ou perfil</summary>
                  <Formulario action={alterarUsuario.bind(null, u.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Texto rotulo="Nome" nome="nome" valor={u.nome} obrigatorio />
                    <Texto rotulo="E-mail (login)" nome="email" tipo="email" valor={u.email} obrigatorio />
                    <Selecao rotulo="Perfil" nome="papel" valor={u.papel} opcoes={opcoesPara(u.papel)} />
                    <div className="flex items-end pb-2">
                      <Caixa rotulo="Pode entrar no sistema (ativo)" nome="ativo" marcado={u.ativo} />
                    </div>
                    <div className="sm:col-span-2">
                      <BotaoEnviar>Salvar</BotaoEnviar>
                    </div>
                  </Formulario>
                </details>
              ) : (
                <p className="text-xs text-stone-400">Seu perfil não altera esta conta.</p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-marca-700">Redefinir a senha</summary>
                <Formulario action={redefinirSenha.bind(null, u.id)} limparAoSalvar className="mt-3 space-y-3">
                  <Texto rotulo="Nova senha" nome="novaSenha" tipo="password" obrigatorio dica="Pelo menos 10 caracteres. Fica registrado no histórico." />
                  <BotaoEnviar variante="secundario">Redefinir senha</BotaoEnviar>
                </Formulario>
              </details>
            </Cartao>
          )
        })}

        <Cartao titulo="Novo usuário">
          <Formulario action={criarUsuario} limparAoSalvar className="grid gap-3 sm:grid-cols-2">
            <Texto rotulo="Nome" nome="nome" obrigatorio />
            <Texto rotulo="E-mail (login)" nome="email" tipo="email" obrigatorio />
            <Selecao rotulo="Perfil" nome="papel" opcoes={opcoesPara()} valor={quem.papel === 'ADMIN' ? 'ADMIN' : 'ASSISTENTE'} />
            <Texto rotulo="Senha inicial" nome="senha" tipo="password" obrigatorio dica="Pelo menos 10 caracteres. A pessoa troca depois em Minha senha." />
            <div className="sm:col-span-2">
              <BotaoEnviar>Criar usuário</BotaoEnviar>
            </div>
          </Formulario>
        </Cartao>
      </div>
    </div>
  )
}
