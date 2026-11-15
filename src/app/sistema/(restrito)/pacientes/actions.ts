'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { criptografar } from '@/lib/cripto'
import { cpfValido, lerData, lerReais, soDigitos } from '@/lib/formatos'
import type { EstadoForm } from '@/components/form'

const texto = (max = 200) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null), z.string().max(max).nullable())
const semVazio = (v: unknown) => (v === '' || v === undefined ? null : v)

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do paciente.').max(160),
  nomeSocial: texto(160),
  dataNascimento: texto(10),
  cpf: texto(20),
  telefone: texto(20),
  email: z.preprocess((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim().toLowerCase() : null), z.string().email('E-mail inválido.').nullable()),
  endereco: texto(300),
  cidade: texto(120),
  profissao: texto(120),
  estadoCivil: texto(60),
  contatoEmergencia: texto(160),
  telefoneEmergencia: texto(20),
  responsavelNome: texto(160),
  responsavelCpf: texto(20),
  responsavelTelefone: texto(20),
  modalidade: z.preprocess(semVazio, z.enum(['PRESENCIAL', 'ONLINE', 'DOMICILIO']).nullable()),
  area: z.preprocess(semVazio, z.enum(['GESTACAO', 'PUERPERIO', 'PARENTALIDADE', 'SAUDE_MENTAL', 'OUTRO']).nullable()),
  dataReferenciaBebe: texto(10),
  comoConheceu: texto(160),
  valorSessao: texto(20),
  status: z.enum(['ATIVO', 'PAUSADO', 'ALTA', 'INATIVO']).default('ATIVO'),
  inicioAtendimento: texto(10),
  queixa: texto(10000),
  observacoes: texto(10000),
  consentimentoLgpd: z.preprocess((v) => v === 'on', z.boolean()),
  preCadastroId: texto(40),
})

export async function salvarPaciente(id: string | null, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const clinico = podeVerClinico(usuario)
  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data

  const datas = {
    dataNascimento: lerData(d.dataNascimento),
    dataReferenciaBebe: lerData(d.dataReferenciaBebe),
    inicioAtendimento: lerData(d.inicioAtendimento),
  }
  for (const [campo, valor] of Object.entries(datas)) {
    if (valor === undefined) return { erro: `Data inválida em "${campo}".` }
  }
  for (const [rotulo, cpf] of [['CPF do paciente', d.cpf], ['CPF do responsável', d.responsavelCpf]] as const) {
    if (cpf && !cpfValido(cpf)) return { erro: `${rotulo} inválido. Confira os números.` }
  }
  const valorSessaoCentavos = lerReais(d.valorSessao)
  if (Number.isNaN(valorSessaoCentavos) || (valorSessaoCentavos ?? 0) < 0) return { erro: 'Valor da sessão inválido. Ex.: 150,00' }

  const anterior = id ? await db.paciente.findUnique({ where: { id }, select: { consentimentoLgpdEm: true } }) : null
  if (id && !anterior) return { erro: 'Paciente não encontrado.' }

  const registro = {
    nome: d.nome,
    nomeSocial: d.nomeSocial,
    dataNascimento: datas.dataNascimento ?? null,
    cpf: d.cpf ? soDigitos(d.cpf) : null,
    telefone: d.telefone ? soDigitos(d.telefone) : null,
    email: d.email,
    endereco: d.endereco,
    cidade: d.cidade,
    profissao: d.profissao,
    estadoCivil: d.estadoCivil,
    contatoEmergencia: d.contatoEmergencia,
    telefoneEmergencia: d.telefoneEmergencia ? soDigitos(d.telefoneEmergencia) : null,
    responsavelNome: d.responsavelNome,
    responsavelCpf: d.responsavelCpf ? soDigitos(d.responsavelCpf) : null,
    responsavelTelefone: d.responsavelTelefone ? soDigitos(d.responsavelTelefone) : null,
    modalidade: d.modalidade,
    area: d.area,
    dataReferenciaBebe: datas.dataReferenciaBebe ?? null,
    comoConheceu: d.comoConheceu,
    valorSessaoCentavos,
    status: d.status,
    inicioAtendimento: datas.inicioAtendimento ?? null,
    // Textos clínicos: só a psicóloga grava. Para os outros perfis, ficam como estão.
    ...(clinico ? { queixaCripto: criptografar(d.queixa), observacoesCripto: criptografar(d.observacoes) } : {}),
    // Guarda a data em que o consentimento foi marcado pela primeira vez.
    consentimentoLgpdEm: d.consentimentoLgpd ? (anterior?.consentimentoLgpdEm ?? new Date()) : null,
  }

  let pacienteId = id
  if (id) {
    await db.paciente.update({ where: { id }, data: registro })
    await auditar({ usuario, acao: 'ALTERAR', entidade: 'Paciente', entidadeId: id, resumo: `Alterou o cadastro de ${d.nome}` })
  } else {
    const novo = await db.$transaction(async (tx) => {
      const p = await tx.paciente.create({ data: registro })
      if (d.preCadastroId) {
        await tx.preCadastro.updateMany({
          where: { id: d.preCadastroId, pacienteId: null },
          data: { pacienteId: p.id, status: 'CONVERTIDO' },
        })
        // Fichas de anamnese do pedido passam a ser do paciente.
        await tx.fichaAnamnese.updateMany({ where: { preCadastroId: d.preCadastroId, pacienteId: null }, data: { pacienteId: p.id } })
      }
      return p
    })
    pacienteId = novo.id
    await auditar({ usuario, acao: 'CRIAR', entidade: 'Paciente', entidadeId: novo.id, resumo: `Cadastrou o paciente ${d.nome}` })
  }

  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/pacientes/${pacienteId}`)
}
