import { exigirAcessoPacientes, podeVerClinico } from '@/lib/auth'
import { AREAS, MODALIDADES, opcoes } from '@/lib/rotulos'
import { Cabecalho, Cartao, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { AreaTexto, Selecao, Texto } from '@/components/campos'
import { registrarContatoManual } from '../actions'

export default async function NovoContato() {
  const usuario = await exigirAcessoPacientes()
  return (
    <div className="mx-auto max-w-xl">
      <Cabecalho titulo="Registrar contato" descricao="Para quem chamou direto no WhatsApp ou chegou por indicação." acoes={<LinkBotao href="/sistema/pre-cadastros">Voltar</LinkBotao>} />
      <Cartao>
        <Formulario action={registrarContatoManual} className="grid gap-4 sm:grid-cols-2">
          <Texto rotulo="Nome" nome="nome" obrigatorio className="sm:col-span-2" />
          <Texto rotulo="Telefone / WhatsApp" nome="telefone" tipo="tel" modo="tel" obrigatorio placeholder="(61) 99999-9999" />
          <Selecao
            rotulo="Como chegou"
            nome="origem"
            valor="WHATSAPP"
            opcoes={[
              { valor: 'WHATSAPP', texto: 'WhatsApp' },
              { valor: 'INDICACAO', texto: 'Indicação' },
              { valor: 'OUTRO', texto: 'Outro' },
            ]}
          />
          <Selecao rotulo="Modalidade" nome="modalidade" vazio="—" opcoes={opcoes(MODALIDADES)} />
          <Selecao rotulo="Assunto" nome="area" vazio="—" opcoes={opcoes(AREAS)} />
          {podeVerClinico(usuario) && <AreaTexto rotulo="🔒 Anotações sobre o contato" nome="observacao" linhas={3} className="sm:col-span-2" />}
          <div className="sm:col-span-2">
            <BotaoEnviar>Registrar e continuar</BotaoEnviar>
          </div>
        </Formulario>
        <p className="mt-3 text-xs text-stone-500">Depois de registrar, você pode enviar a ficha de anamnese e cadastrar como paciente, como num pedido do site.</p>
      </Cartao>
    </div>
  )
}
