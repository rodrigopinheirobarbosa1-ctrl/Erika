'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/lib/db'
import { criptografar } from '@/lib/cripto'
import { linkWhatsapp, soDigitos } from '@/lib/formatos'
import { site } from '@/lib/site'
import { ipDaRequisicao } from '@/lib/auth'
import { minutosDeBloqueio, registrarErro } from '@/lib/limite-tentativas'
import type { EstadoForm } from '@/components/form'

/** Pedidos de contato aceitos do mesmo endereço em 15 minutos (contra spam). */
const MAXIMO_ENVIOS = 5

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

  const ip = ipDaRequisicao(await headers()) ?? 'local'
  const chave = `pre-cadastro|${ip}`
  if ((await minutosDeBloqueio(chave, MAXIMO_ENVIOS)) > 0) {
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
  await registrarErro(chave) // conta o envio no limite de envios por aparelho

  return { ok: `Obrigada, ${d.nome.split(' ')[0]}! Recebi seu contato e retorno em breve pelo telefone informado.` }
}

const interesseWhatsapp = z.object({
  nome: z.string().trim().min(2, 'Informe o seu nome.').max(120),
  telefone: z
    .string()
    .trim()
    .refine((t) => soDigitos(t).length >= 10 && soDigitos(t).length <= 13, 'Informe o seu WhatsApp com DDD.'),
  consentimento: z.literal('on', { errorMap: () => ({ message: 'Marque que concorda com o uso dos seus dados.' }) }),
})

/**
 * Botão do WhatsApp no site: antes de abrir a conversa, registra o interesse
 * (nome + telefone) como pedido de contato e devolve o link do WhatsApp com
 * a mensagem já personalizada. O mesmo telefone em menos de 24 h não gera
 * pedido repetido.
 */
export async function registrarInteresseWhatsapp(dados: FormData): Promise<{ erro?: string; link?: string }> {
  if (!site.whatsapp) return { erro: 'WhatsApp indisponível no momento.' }
  if (String(dados.get('site') ?? '') !== '') return { link: linkWhatsapp(site.whatsapp, site.mensagemWhatsapp) }

  const ip = ipDaRequisicao(await headers()) ?? 'local'
  const chave = `pre-cadastro|${ip}`
  if ((await minutosDeBloqueio(chave, MAXIMO_ENVIOS)) > 0) return { link: linkWhatsapp(site.whatsapp, site.mensagemWhatsapp) }

  const r = interesseWhatsapp.safeParse(Object.fromEntries(dados))
  if (!r.success) return { erro: r.error.issues[0].message }
  const telefone = soDigitos(r.data.telefone)

  const recente = await db.preCadastro.findFirst({ where: { telefone, criadoEm: { gte: new Date(Date.now() - 86400000) } }, select: { id: true } })
  if (!recente) {
    await db.preCadastro.create({ data: { nome: r.data.nome, telefone, origem: 'WHATSAPP_SITE', consentimentoEm: new Date(), ip } })
    await registrarErro(chave) // conta no limite de envios por aparelho
  }
  const primeiro = r.data.nome.split(' ')[0]
  return { link: linkWhatsapp(site.whatsapp, `Olá, Érika! Sou ${primeiro}, vim pelo site e gostaria de agendar uma consulta.`) }
}
