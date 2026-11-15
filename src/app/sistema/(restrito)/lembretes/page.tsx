import { db } from '@/lib/db'
import { exigirAcessoPacientes } from '@/lib/auth'
import { garantirModelos } from '@/lib/mensagens-servidor'
import { rotuloAntecedencia, VARIAVEIS } from '@/lib/mensagens'
import { veFinanceiro } from '@/lib/permissoes'
import { Aviso, Cabecalho, Cartao, Etiqueta } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { AreaTexto, Caixa, Texto } from '@/components/campos'
import { excluirLembrete, salvarModelo } from './actions'

function Antecedencia({ min }: { min: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
      <Texto rotulo="Dias antes" nome="dias" tipo="number" modo="numeric" valor={Math.floor(min / 1440)} />
      <Texto rotulo="Horas" nome="horas" tipo="number" modo="numeric" valor={Math.floor((min % 1440) / 60)} />
      <Texto rotulo="Minutos" nome="minutos" tipo="number" modo="numeric" valor={min % 60} />
    </div>
  )
}

export default async function Lembretes() {
  const usuario = await exigirAcessoPacientes()
  const pode = veFinanceiro(usuario.papel)
  await garantirModelos()
  const modelos = await db.modeloMensagem.findMany({ orderBy: [{ tipo: 'asc' }, { antecedenciaMin: 'desc' }] })

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Mensagens e lembretes" descricao="Textos enviados ao paciente pelo WhatsApp, com um toque." />
      <div className="mb-5">
        <Aviso>
          <p>Variáveis que o sistema troca pelos dados da sessão:</p>
          <ul className="mt-1 space-y-0.5">
            {VARIAVEIS.map(([v, d]) => (
              <li key={v}>
                <code className="rounded bg-white px-1">{v}</code> — {d}
              </li>
            ))}
          </ul>
          <p className="mt-2">Os lembretes aparecem no Painel e na Agenda quando chega a hora; um toque abre o WhatsApp com o texto pronto.</p>
        </Aviso>
      </div>
      {!pode && (
        <div className="mb-5">
          <Aviso tom="amarelo">Só a psicóloga altera os textos e os lembretes.</Aviso>
        </div>
      )}

      <div className="space-y-4">
        {modelos.map((m) => (
          <Cartao
            key={m.id}
            titulo={m.nome}
            acao={
              <span className="flex gap-1.5">
                <Etiqueta tom={m.tipo === 'AGENDAMENTO' ? 'azul' : 'roxo'}>{m.tipo === 'AGENDAMENTO' ? 'Ao agendar' : rotuloAntecedencia(m.antecedenciaMin ?? 0)}</Etiqueta>
                {!m.ativo && <Etiqueta tom="cinza">Desligado</Etiqueta>}
              </span>
            }
          >
            {pode ? (
              <>
                <Formulario action={salvarModelo.bind(null, m.id)} className="grid gap-3 sm:grid-cols-2">
                  <Texto rotulo="Nome" nome="nome" valor={m.nome} obrigatorio className="sm:col-span-2" />
                  {m.tipo === 'LEMBRETE' && <Antecedencia min={m.antecedenciaMin ?? 60} />}
                  <AreaTexto rotulo="Texto" nome="texto" valor={m.texto} linhas={4} className="sm:col-span-2" />
                  <div className="sm:col-span-2">
                    <Caixa rotulo="Ligado" nome="ativo" marcado={m.ativo} />
                  </div>
                  <div className="sm:col-span-2">
                    <BotaoEnviar>Salvar</BotaoEnviar>
                  </div>
                </Formulario>
                {m.tipo === 'LEMBRETE' && (
                  <Formulario action={excluirLembrete.bind(null, m.id)} className="mt-3 border-t border-stone-100 pt-3">
                    <BotaoEnviar variante="perigo" confirmar={`Excluir o lembrete "${m.nome}"?`}>
                      Excluir lembrete
                    </BotaoEnviar>
                  </Formulario>
                )}
              </>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-stone-700">{m.texto}</p>
            )}
          </Cartao>
        ))}

        {pode && (
          <Cartao titulo="Novo lembrete">
            <Formulario action={salvarModelo.bind(null, null)} limparAoSalvar className="grid gap-3 sm:grid-cols-2">
              <Texto rotulo="Nome" nome="nome" obrigatorio placeholder="Ex.: Lembrete de 2 horas antes" className="sm:col-span-2" />
              <Antecedencia min={120} />
              <AreaTexto rotulo="Texto" nome="texto" valor="Olá, {nome}! Lembrando da nossa sessão hoje às {hora}, {onde}." linhas={4} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <BotaoEnviar>Criar lembrete</BotaoEnviar>
              </div>
            </Formulario>
          </Cartao>
        )}
      </div>
    </div>
  )
}
