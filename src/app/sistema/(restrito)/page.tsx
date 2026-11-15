import Link from '@/components/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth'
import { formatarDataHora, formatarTelefone } from '@/lib/formatos'
import { AREAS, MODALIDADES_CURTAS, STATUS_ATENDIMENTO, TOM_ATENDIMENTO } from '@/lib/rotulos'
import { hojeLocal, localParaUtc, somarDias, utcParaLocal } from '@/lib/horario'
import { Aviso, Cabecalho, Cartao, Etiqueta, Indicador, LinkBotao, Vazio } from '@/components/ui'
import { PAPEIS, vePacientes } from '@/lib/permissoes'
import { LembretesAgora } from '@/components/mensagens'

export default async function Painel() {
  const usuario = await exigirUsuario()
  if (!vePacientes(usuario.papel)) {
    return (
      <div className="mx-auto max-w-3xl">
        <Cabecalho titulo={`Olá, ${usuario.nome.split(' ')[0]}`} descricao={PAPEIS[usuario.papel].nome} />
        <Aviso>
          Seu perfil cuida dos acessos ao sistema (menu <strong>Usuários</strong>). Os dados dos pacientes ficam visíveis só para a
          psicóloga e a secretaria, por sigilo profissional.
        </Aviso>
      </div>
    )
  }
  const hoje = hojeLocal()
  const [novos, emContato, ativos, total, recentes, sessoesHoje, fichasRecebidas] = await Promise.all([
    db.preCadastro.count({ where: { status: 'NOVO' } }),
    db.preCadastro.count({ where: { status: 'EM_CONTATO' } }),
    db.paciente.count({ where: { status: 'ATIVO' } }),
    db.paciente.count(),
    db.preCadastro.findMany({ where: { status: { in: ['NOVO', 'EM_CONTATO'] } }, orderBy: { criadoEm: 'desc' }, take: 5 }),
    db.atendimento.findMany({
      where: { inicio: { gte: localParaUtc(hoje, '00:00')!, lt: localParaUtc(somarDias(hoje, 1), '00:00')! } },
      include: { paciente: { select: { nome: true, nomeSocial: true } } },
      orderBy: { inicio: 'asc' },
    }),
    db.fichaAnamnese.findMany({
      where: { status: 'RESPONDIDA', pacienteId: null },
      orderBy: { respondidaEm: 'desc' },
      select: { id: true, nomeDestinatario: true, respondidaEm: true, preCadastroId: true },
    }),
  ])
  const hora = Number(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }))
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo={`${saudacao}, ${usuario.nome.split(' ')[0]}`}
        acoes={<LinkBotao href="/sistema/pacientes/novo" variante="primario">+ Novo paciente</LinkBotao>}
      />

      <LembretesAgora />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo="Pedidos novos" valor={novos} detalhe="Ainda sem resposta" href="/sistema/pre-cadastros" />
        <Indicador titulo="Em contato" valor={emContato} href="/sistema/pre-cadastros" />
        <Indicador titulo="Em atendimento" valor={ativos} href="/sistema/pacientes" />
        <Indicador titulo="Pacientes cadastrados" valor={total} href="/sistema/pacientes?situacao=TODOS" />
      </div>

      <Cartao
        titulo={`Sessões de hoje (${sessoesHoje.filter((s) => s.status === 'AGENDADO' || s.status === 'REALIZADO').length})`}
        className="mt-6"
        acao={<Link href="/sistema/agenda" className="text-sm text-marca-700 hover:underline">Ver agenda</Link>}
      >
        {sessoesHoje.length === 0 ? (
          <Vazio texto="Nenhuma sessão hoje." />
        ) : (
          <ul className="-my-2 divide-y divide-stone-100">
            {sessoesHoje.map((s) => (
              <li key={s.id}>
                <Link href={`/sistema/agenda/${s.id}`} className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 hover:bg-marca-50">
                  <span className="flex items-baseline gap-3">
                    <span className="w-12 font-semibold tabular-nums text-cacau">{utcParaLocal(s.inicio).hora}</span>
                    <span>
                      <span className="block text-stone-800">{s.paciente.nomeSocial || s.paciente.nome}</span>
                      <span className="block text-xs text-stone-500">{MODALIDADES_CURTAS[s.modalidade]}</span>
                    </span>
                  </span>
                  <Etiqueta tom={TOM_ATENDIMENTO[s.status]}>{STATUS_ATENDIMENTO[s.status]}</Etiqueta>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {fichasRecebidas.length > 0 && (
        <Cartao titulo={`Fichas de anamnese recebidas (${fichasRecebidas.length})`} className="mt-6 ring-2 ring-emerald-200">
          <ul className="-my-2 divide-y divide-stone-100">
            {fichasRecebidas.map((f) => (
              <li key={f.id}>
                <Link href={`/sistema/pre-cadastros/${f.preCadastroId}`} className="-mx-2 flex justify-between gap-2 rounded-lg px-2 py-2.5 hover:bg-marca-50">
                  <span className="text-stone-800">{f.nomeDestinatario}</span>
                  <span className="text-xs text-stone-400">respondeu {formatarDataHora(f.respondidaEm!)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Abra o pedido para ver a ficha e cadastrar como paciente.</p>
        </Cartao>
      )}

      <Cartao titulo="Pedidos de contato em aberto" className="mt-6" acao={<Link href="/sistema/pre-cadastros" className="text-sm text-marca-700 hover:underline">Ver todos</Link>}>
        {recentes.length === 0 ? (
          <Vazio texto="Nenhum pedido em aberto." />
        ) : (
          <ul className="-my-2 divide-y divide-stone-100">
            {recentes.map((p) => (
              <li key={p.id}>
                <Link href={`/sistema/pre-cadastros/${p.id}`} className="-mx-2 flex flex-wrap justify-between gap-2 rounded-lg px-2 py-3 hover:bg-marca-50">
                  <span>
                    <span className="block font-medium text-stone-800">
                      {p.nome}
                      {p.status === 'NOVO' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">novo</span>}
                    </span>
                    <span className="block text-sm text-stone-500">{[formatarTelefone(p.telefone), p.area && AREAS[p.area]].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-xs text-stone-400">{formatarDataHora(p.criadoEm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}
