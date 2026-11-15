'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/lib/db'
import { criptografar } from '@/lib/cripto'
import { soDigitos } from '@/lib/formatos'
import { minutosDeBloqueio, registrarErro } from '@/lib/limite-tentativas'
import type { EstadoForm } from '@/components/form'

const vazioParaNulo = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe o seu nome.').max(120),
  telefone: z
    .string()
    .trim()
    .refine((t) => soDigitos(t).length >= 10 && soDigitos(t).length <= 13, 'Informe um telefone com DDD.'),
  email: z.preprocess(vazioParaNulo, z.string().trim().toLowerCase().email('E-mail inválido.').max(160).optional()),
  modalidade: z.preprocess(vazioParaNulo, z.enum(['PRESENCIAL', 'ONLINE', 'DOMICILIO']).optional()),
  area: z.preprocess(vazioParaNulo, z.enum(['GESTACAO', 'PUERPERIO', 'PARENTALIDADE', 'SAUDE_MENTAL', 'OUTRO']).optional()),
  melhorHorario: z.preprocess(vazioParaNulo, z.string().trim().max(120).optional()),
  motivo: z.preprocess(vazioParaNulo, z.string().trim().max(2000, 'Texto muito longo (máximo 2.000 letras).').optional()),
  consentimento: z.literal('on', { errorMap: () => ({ message: 'Para enviar, marque que concorda com o uso dos seus dados.' }) }),
})

/** Formulário "Agende sua consulta" do site público. */
export async function enviarPreCadastro(_e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  // Campo invisível: pessoas não preenchem, robôs de spam sim.
  if (String(dados.get('site') ?? '') !== '') return { ok: 'Recebido! Em breve entraremos em contato.' }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const chave = `pre-cadastro|${ip}`
  if (minutosDeBloqueio(chave) > 0) {
    return { erro: 'Recebemos vários envios seguidos deste aparelho. Aguarde alguns minutos e tente de novo.' }
  }

  const r = esquema.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const d = r.data

  await db.preCadastro.create({
    data: {
      nome: d.nome,
      telefone: soDigitos(d.telefone),
      email: d.email ?? null,
      modalidade: d.modalidade ?? null,
      area: d.area ?? null,
      melhorHorario: d.melhorHorario ?? null,
      motivoCripto: criptografar(d.motivo),
      consentimentoEm: new Date(),
      ip,
    },
  })
  registrarErro(chave) // conta o envio no limite de envios por aparelho

  return { ok: `Obrigada, ${d.nome.split(' ')[0]}! Recebi seu contato e retorno em breve pelo telefone informado.` }
}
