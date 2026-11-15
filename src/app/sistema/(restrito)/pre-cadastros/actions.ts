'use server'

import { revalidatePath } from 'next/cache'
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
