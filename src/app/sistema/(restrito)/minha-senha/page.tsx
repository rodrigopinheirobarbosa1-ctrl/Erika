import { exigirUsuario } from '@/lib/auth'
import { Cabecalho, Cartao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Texto } from '@/components/campos'
import { trocarSenha } from './actions'

export default async function MinhaSenha() {
  await exigirUsuario()
  return (
    <div className="mx-auto max-w-md">
      <Cabecalho titulo="Minha senha" />
      <Cartao>
        <Formulario action={trocarSenha} limparAoSalvar className="space-y-4">
          <Texto rotulo="Senha atual" nome="atual" tipo="password" obrigatorio />
          <Texto rotulo="Nova senha" nome="nova" tipo="password" obrigatorio dica="Pelo menos 10 caracteres." />
          <Texto rotulo="Repita a nova senha" nome="confirmacao" tipo="password" obrigatorio />
          <BotaoEnviar>Trocar senha</BotaoEnviar>
        </Formulario>
      </Cartao>
    </div>
  )
}
