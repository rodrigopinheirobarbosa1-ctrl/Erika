'use server'

import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { ipDaRequisicao } from '@/lib/auth'
import { criptografar } from '@/lib/cripto'
import { minutosDeBloqueio, registrarErro } from '@/lib/limite-tentativas'
import { MODELOS } from '@/lib/anamnese/modelo'
import { lerRespostas } from '@/lib/anamnese/respostas'
import type { EstadoForm } from '@/components/form'

const MAXIMO_ENVIOS = 10

/** Envio da ficha pelo paciente (página pública, sem login: vale o link). */
export async function enviarFicha(token: string, _e: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const ip = ipDaRequisicao(await headers()) ?? 'local'
  const chave = `ficha|${ip}`
  if ((await minutosDeBloqueio(chave, MAXIMO_ENVIOS)) > 0) return { erro: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.' }

  const ficha = await db.fichaAnamnese.findUnique({ where: { token } })
  if (!ficha || ficha.status !== 'PENDENTE' || ficha.expiraEm < new Date()) {
    await registrarErro(chave)
    return { erro: 'Este link não está mais disponível. Peça um novo à psicóloga.' }
  }
  if (dados.get('consentimento') !== 'on') return { erro: 'Para enviar, marque que concorda com o uso dos seus dados.' }

  const modelo = MODELOS[ficha.modeloVersao]
  const lido = lerRespostas(modelo, dados)
  if ('erro' in lido) return { erro: lido.erro }

  // updateMany com status PENDENTE: se dois envios chegarem juntos, só um vale.
  const { count } = await db.fichaAnamnese.updateMany({
    where: { id: ficha.id, status: 'PENDENTE' },
    data: { status: 'RESPONDIDA', respostasCripto: criptografar(JSON.stringify(lido.respostas)), respondidaEm: new Date(), consentimentoEm: new Date(), ip },
  })
  if (count === 0) return { erro: 'Esta ficha já foi enviada.' }
  await registrarErro(chave) // conta o envio no limite por aparelho
  return { ok: 'enviada' }
}
