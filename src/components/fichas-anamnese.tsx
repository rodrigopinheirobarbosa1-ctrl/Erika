import type { FichaAnamnese } from '@prisma/client'
import Link from '@/components/link'
import { enderecoBase } from '@/lib/endereco'
import { formatarDataHora, linkWhatsapp } from '@/lib/formatos'
import { site } from '@/lib/site'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Cartao, Etiqueta } from '@/components/ui'
import { cancelarFicha, gerarFicha } from '@/app/sistema/(restrito)/fichas/actions'
import { CopiarTexto } from '@/components/copiar-texto'

/** Quadro "Ficha de anamnese" (no pedido de contato e na ficha do paciente). */
export async function FichasAnamnese({
  fichas,
  alvo,
  nome,
  telefone,
  clinico,
  linkCadastro,
}: {
  fichas: FichaAnamnese[]
  alvo: { preCadastroId?: string; pacienteId?: string }
  nome: string
  telefone: string | null
  clinico: boolean
  /** Pedido de contato com ficha respondida: link para virar paciente. */
  linkCadastro?: (fichaId: string) => string
}) {
  const base = await enderecoBase()
  const agora = new Date()
  const pendente = fichas.find((f) => f.status === 'PENDENTE' && f.expiraEm > agora)
  const respondidas = fichas.filter((f) => f.status === 'RESPONDIDA')
  const link = pendente ? `${base}/ficha/${pendente.token}` : null
  const mensagem = link
    ? `Olá, ${nome.split(' ')[0]}! Aqui é a Érika Dias, psicóloga (${site.crp}). Para darmos início ao seu acompanhamento, peço que preencha esta ficha de anamnese. É sigilosa e leva uns 10 minutos: ${link}`
    : ''

  return (
    <Cartao titulo="Ficha de anamnese" className="lg:col-span-2">
      {respondidas.map((f) => (
        <div key={f.id} className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <Etiqueta tom="verde">Respondida</Etiqueta>
            <span className="text-stone-600">em {formatarDataHora(f.respondidaEm!)}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {clinico ? (
              <Link href={`/sistema/fichas/${f.id}`} className="btn-primario">
                Ver respostas
              </Link>
            ) : (
              <span className="text-xs text-stone-500">As respostas são vistas só pela psicóloga.</span>
            )}
            {linkCadastro && (
              <Link href={linkCadastro(f.id)} className="btn-secundario">
                Cadastrar como paciente com estes dados
              </Link>
            )}
          </div>
        </div>
      ))}

      {pendente && link ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            <Etiqueta tom="amarelo">Aguardando resposta</Etiqueta> · link gerado em {formatarDataHora(pendente.criadoEm)} por {pendente.enviadaPorNome} · vale até{' '}
            {formatarDataHora(pendente.expiraEm)}
          </p>
          <div className="flex flex-wrap gap-2">
            {telefone && (
              <a href={linkWhatsapp(telefone, mensagem)} target="_blank" rel="noopener noreferrer" className="btn-primario">
                Enviar pelo WhatsApp
              </a>
            )}
            <CopiarTexto texto={link} rotulo="Copiar link" />
            <CopiarTexto texto={mensagem} rotulo="Copiar mensagem" />
          </div>
          <details>
            <summary className="cursor-pointer text-xs text-stone-500">Cancelar ou gerar outro link</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              <Formulario action={cancelarFicha.bind(null, pendente.id)}>
                <BotaoEnviar variante="perigo" confirmar="Cancelar este link? Ele deixa de abrir.">
                  Cancelar link
                </BotaoEnviar>
              </Formulario>
              <Formulario action={gerarFicha.bind(null, alvo)}>
                <BotaoEnviar variante="secundario">Gerar link novo</BotaoEnviar>
              </Formulario>
            </div>
          </details>
        </div>
      ) : (
        <Formulario action={gerarFicha.bind(null, alvo)}>
          <p className="mb-3 text-sm text-stone-600">
            {respondidas.length ? 'Precisa de uma ficha nova? ' : ''}Gere um link exclusivo (vale 15 dias, uso único) e envie pelo WhatsApp.
          </p>
          <BotaoEnviar>{respondidas.length ? 'Gerar nova ficha' : 'Gerar link da ficha'}</BotaoEnviar>
        </Formulario>
      )}
    </Cartao>
  )
}
