'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { entrar, ipDaRequisicao, limparSessoesVencidas } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { limparTentativas, minutosDeBloqueio, registrarErro } from '@/lib/limite-tentativas'
import type { EstadoForm } from '@/components/form'

/** Erros permitidos em 15 minutos, do mesmo endereço para o mesmo e-mail (igual ao Mathima). */
const MAXIMO_POR_ENDERECO = 8
/** Erros permitidos em 15 minutos para o mesmo e-mail, venham de onde vierem. */
const MAXIMO_POR_EMAIL = 30

export async function acaoEntrar(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = String(dados.get('email') ?? '').trim().toLowerCase()
  const senha = String(dados.get('senha') ?? '')
  if (!email || !senha) return { erro: 'Informe o e-mail e a senha.' }

  const origem = ipDaRequisicao(await headers()) ?? 'local'
  const chaveEndereco = `${origem}|${email}`
  const chaveEmail = `*|${email}`
  const espera = Math.max(
    await minutosDeBloqueio(chaveEndereco, MAXIMO_POR_ENDERECO),
    await minutosDeBloqueio(chaveEmail, MAXIMO_POR_EMAIL),
  )
  if (espera > 0) return { erro: `Muitas tentativas seguidas. Aguarde ${espera} minuto(s) e tente novamente.` }

  const usuario = await entrar(email, senha)
  if (!usuario) {
    await registrarErro(chaveEndereco)
    await registrarErro(chaveEmail)
    return { erro: 'E-mail ou senha incorretos.' }
  }
  await limparTentativas(chaveEndereco)
  await limparSessoesVencidas()
  await auditar({ usuario, acao: 'LOGIN', entidade: 'Usuario', entidadeId: usuario.id, resumo: `${usuario.nome} entrou no sistema` })
  redirect('/sistema')
}
