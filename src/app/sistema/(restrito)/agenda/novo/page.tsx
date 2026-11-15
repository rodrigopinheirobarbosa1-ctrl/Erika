import { db } from '@/lib/db'
import { exigirAcessoPacientes } from '@/lib/auth'
import { hojeLocal } from '@/lib/horario'
import { MODALIDADES } from '@/lib/rotulos'
import { Aviso, Cabecalho, Cartao, LinkBotao } from '@/components/ui'
import { BotaoEnviar, Formulario } from '@/components/form'
import { Caixa, Selecao, Texto } from '@/components/campos'
import { agendar } from '../actions'

export default async function NovoAgendamento({ searchParams }: { searchParams: Promise<{ paciente?: string; data?: string }> }) {
  await exigirAcessoPacientes()
  const { paciente, data } = await searchParams
  const pacientes = await db.paciente.findMany({
    where: { status: { in: ['ATIVO', 'PAUSADO'] } },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, nomeSocial: true },
  })

  return (
    <div className="mx-auto max-w-xl">
      <Cabecalho titulo="Agendar sessão" acoes={<LinkBotao href="/sistema/agenda">Voltar</LinkBotao>} />
      {pacientes.length === 0 ? (
        <Aviso tom="amarelo">
          Nenhum paciente em atendimento. Cadastre o paciente primeiro (menu <strong>Pacientes</strong>).
        </Aviso>
      ) : (
        <Cartao>
          <Formulario action={agendar} className="grid gap-4 sm:grid-cols-2">
            <Selecao
              rotulo="Paciente"
              nome="pacienteId"
              obrigatorio
              vazio="Escolha…"
              valor={paciente}
              opcoes={pacientes.map((p) => ({ valor: p.id, texto: p.nomeSocial ? `${p.nomeSocial} (${p.nome})` : p.nome }))}
              className="sm:col-span-2"
            />
            <Texto rotulo="Data" nome="data" tipo="date" valor={data ?? hojeLocal()} obrigatorio />
            <label className="block">
              <span className="rotulo">Horário</span>
              <input type="time" name="hora" required step={300} className="campo" />
            </label>
            <Texto rotulo="Duração (minutos)" nome="duracaoMin" tipo="number" valor={50} modo="numeric" obrigatorio />
            <Selecao rotulo="Modalidade" nome="modalidade" vazio="A do cadastro do paciente" opcoes={Object.entries(MODALIDADES).map(([valor, texto]) => ({ valor, texto }))} />
            <Texto rotulo="Link da videochamada (se online)" nome="linkOnline" placeholder="https://meet.google.com/…" className="sm:col-span-2" />
            <Texto rotulo="Recado de agenda (não clínico)" nome="recado" placeholder="Ex.: vem com o bebê" maximo={300} className="sm:col-span-2" />
            <Selecao
              rotulo="Repetir toda semana"
              nome="repetirSemanas"
              valor="0"
              opcoes={[
                { valor: '0', texto: 'Não repetir' },
                ...[3, 7, 11, 15, 23, 51].map((n) => ({ valor: String(n), texto: `Por mais ${n} semanas (${n + 1} sessões)` })),
              ]}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Caixa rotulo="Agendar mesmo com conflito de horário" nome="ignorarConflito" />
            </div>
            <div className="sm:col-span-2">
              <BotaoEnviar>Agendar</BotaoEnviar>
            </div>
          </Formulario>
        </Cartao>
      )}
    </div>
  )
}
