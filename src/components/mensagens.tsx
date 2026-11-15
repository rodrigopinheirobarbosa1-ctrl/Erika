import Link from '@/components/link'
import { db } from '@/lib/db'
import { formatarDataHora, linkWhatsapp } from '@/lib/formatos'
import { utcParaLocal } from '@/lib/horario'
import { rotuloAntecedencia } from '@/lib/mensagens'
import { lembretesAgora, modelosAtivos, textoPara } from '@/lib/mensagens-servidor'
import { Aviso, Cartao } from '@/components/ui'
import { BotaoEnvio, BotaoPular } from '@/components/botao-envio'

/** Quadro da sessão: confirmação + cada lembrete, com o que já foi enviado. */
export async function MensagensSessao({ atendimentoId, destaque }: { atendimentoId: string; destaque?: boolean }) {
  const [modelos, s] = await Promise.all([
    modelosAtivos(),
    db.atendimento.findUnique({
      where: { id: atendimentoId },
      include: { paciente: { select: { nome: true, nomeSocial: true, endereco: true, cidade: true, telefone: true, salaVideo: true } }, envios: true },
    }),
  ])
  if (!s) return null
  const telefone = s.paciente.telefone
  const ativa = s.status === 'AGENDADO' && s.inicio > new Date()

  return (
    <Cartao titulo="Mensagens ao paciente" className={destaque ? 'ring-2 ring-marca-300' : ''}>
      {destaque && (
        <div className="mb-4">
          <Aviso tom="verde">Sessão agendada! Envie a confirmação ao paciente pelo WhatsApp.</Aviso>
        </div>
      )}
      {!telefone && (
        <div className="mb-3">
          <Aviso tom="amarelo">
            O paciente não tem telefone no cadastro. <Link href={`/sistema/pacientes/${s.pacienteId}/editar`} className="underline">Cadastrar telefone</Link>
          </Aviso>
        </div>
      )}
      {s.modalidade === 'ONLINE' && !s.linkOnline && !s.paciente.salaVideo && (
        <p className="mb-3 text-xs text-amber-800">Sessão online sem link da videochamada — preencha em “Remarcar ou alterar” para ele ir na mensagem.</p>
      )}
      <ul className="divide-y divide-stone-100">
        {modelos.map((m) => {
          const envio = s.envios.find((e) => e.modeloId === m.id)
          const texto = textoPara(m.texto, s)
          return (
            <li key={m.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="block text-sm font-medium text-stone-800">{m.nome}</span>
                  <span className="block text-xs text-stone-500">
                    {envio
                      ? `${envio.pulado ? 'Pulado' : 'Enviado'} em ${formatarDataHora(envio.enviadoEm)} por ${envio.enviadoPorNome}`
                      : m.tipo === 'LEMBRETE' && m.antecedenciaMin
                        ? `${rotuloAntecedencia(m.antecedenciaMin)} — aparece no painel na hora certa`
                        : 'Ainda não enviada'}
                  </span>
                </span>
                {telefone && (ativa || envio) && (
                  <BotaoEnvio
                    href={linkWhatsapp(telefone, texto)}
                    atendimentoId={s.id}
                    modeloId={m.id}
                    rotulo={envio && !envio.pulado ? 'Enviar de novo' : 'Enviar pelo WhatsApp'}
                    variante={!envio && m.tipo === 'AGENDAMENTO' ? 'primario' : 'secundario'}
                  />
                )}
              </div>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-marca-700">Ver texto</summary>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-stone-50 p-2 text-xs text-stone-600">{texto}</p>
              </details>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-stone-400">
        Textos e lembretes: menu <Link href="/sistema/lembretes" className="underline">Lembretes</Link>.
      </p>
    </Cartao>
  )
}

/** Lista "Lembretes para enviar agora" (painel e agenda). */
export async function LembretesAgora() {
  const lista = await lembretesAgora()
  if (lista.length === 0) return null
  return (
    <Cartao titulo={`Lembretes para enviar agora (${lista.length})`} className="mb-6 ring-2 ring-amber-200">
      <ul className="-my-2 divide-y divide-stone-100">
        {lista.map(({ sessao: s, regra: r, texto }) => (
          <li key={s.id + r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <Link href={`/sistema/agenda/${s.id}`} className="hover:underline">
              <span className="block text-stone-800">{s.paciente.nomeSocial || s.paciente.nome}</span>
              <span className="block text-xs text-stone-500">
                {r.nome} · sessão {utcParaLocal(s.inicio).data.split('-').reverse().slice(0, 2).join('/')} às {utcParaLocal(s.inicio).hora}
              </span>
            </Link>
            <span className="flex items-center gap-3">
              <BotaoPular atendimentoId={s.id} modeloId={r.id} />
              {s.paciente.telefone ? (
                <BotaoEnvio href={linkWhatsapp(s.paciente.telefone, texto)} atendimentoId={s.id} modeloId={r.id} rotulo="WhatsApp" />
              ) : (
                <span className="text-xs text-amber-700">sem telefone</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Cartao>
  )
}
