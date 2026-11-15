'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { exigirAcessoPacientesAction, podeVerClinico } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { criptografar } from '@/lib/cripto'
import type { EstadoForm } from '@/components/form'

const esquema = z.object({
  status: z.enum(['NOVO', 'EM_CONTATO', 'DESCARTADO']),
  observacao: z.string().max(5000).optional(),
})

export async function atualizarPreCadastro(id: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }

  const atual = await db.preCadastro.findUnique({ where: { id } })
  if (!atual) return { erro: 'Pedido não encontrado.' }
  await db.preCadastro.update({
    where: { id },
    data: {
      // Pedido que já virou paciente continua "convertido".
      status: atual.pacienteId ? 'CONVERTIDO' : r.data.status,
      ...(podeVerClinico(usuario) ? { observacaoCripto: criptografar(r.data.observacao) } : {}),
    },
  })
  await auditar({ usuario, acao: 'ALTERAR', entidade: 'PreCadastro', entidadeId: id, resumo: `Atualizou o pedido de contato de ${atual.nome}` })
  revalidatePath('/sistema', 'layout')
  return { ok: 'Salvo.' }
}

const manual = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(120),
  telefone: z.string().trim().refine((t) => t.replace(/\D/g, '').length >= 10, 'Informe o telefone com DDD.'),
  origem: z.enum(['WHATSAPP', 'INDICACAO', 'OUTRO']),
  modalidade: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['PRESENCIAL', 'ONLINE', 'DOMICILIO']).optional()),
  area: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['GESTACAO', 'PUERPERIO', 'PARENTALIDADE', 'SAUDE_MENTAL', 'OUTRO']).optional()),
  observacao: z.string().max(5000).optional(),
})

/** Contato que chegou direto pelo WhatsApp (ou indicação): registrado à mão. */
export async function registrarContatoManual(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirAcessoPacientesAction()
  const r = manual.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data
  const novo = await db.preCadastro.create({
    data: {
      nome: d.nome,
      telefone: d.telefone.replace(/\D/g, ''),
      origem: d.origem,
      modalidade: d.modalidade ?? null,
      area: d.area ?? null,
      status: 'EM_CONTATO',
      // A pessoa procurou a psicóloga por conta própria; o consentimento formal
      // da LGPD é colhido na ficha de anamnese.
      consentimentoEm: new Date(),
      ...(podeVerClinico(usuario) && d.observacao ? { observacaoCripto: criptografar(d.observacao) } : {}),
    },
  })
  await auditar({ usuario, acao: 'CRIAR', entidade: 'PreCadastro', entidadeId: novo.id, resumo: `Registrou contato de ${d.nome} (${d.origem === 'WHATSAPP' ? 'WhatsApp' : d.origem === 'INDICACAO' ? 'indicação' : 'outro'})` })
  revalidatePath('/sistema', 'layout')
  redirect(`/sistema/pre-cadastros/${novo.id}`)
}
