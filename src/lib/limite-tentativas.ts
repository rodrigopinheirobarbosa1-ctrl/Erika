/**
 * Primeira barreira contra tentativas repetidas de adivinhar senha.
 *
 * As tentativas ficam no BANCO (tabela TentativaLogin), e não na memória do
 * servidor: na Vercel cada acesso pode ser atendido por uma cópia diferente do
 * servidor, e um contador em memória recomeçaria do zero a cada cópia — quem
 * tentasse adivinhar a senha teria tentativas quase ilimitadas.
 *
 * A conta (quantos erros, quanto falta para liberar) é código puro, testado
 * diretamente; o banco só guarda os números.
 */
import { db } from './db'

export const JANELA = 15 * 60 * 1000 // 15 minutos

export type Registro = { erros: number; primeiraEm: Date }

/** Minutos de espera para quem já errou `registro.erros` vezes; 0 se liberado. */
export function calcularBloqueio(registro: Registro | null, maximo: number, agora = Date.now()): number {
  if (!registro) return 0
  const passou = agora - registro.primeiraEm.getTime()
  if (passou > JANELA || registro.erros < maximo) return 0
  return Math.max(1, Math.ceil((JANELA - passou) / 60000))
}

type Banco = Pick<typeof db, 'tentativaLogin'>

/** Devolve os minutos de espera se a chave estiver bloqueada; 0 se liberada. */
export async function minutosDeBloqueio(chave: string, maximo: number, banco: Banco = db): Promise<number> {
  return calcularBloqueio(await banco.tentativaLogin.findUnique({ where: { chave } }), maximo)
}

export async function registrarErro(chave: string, banco: Banco = db): Promise<void> {
  const agora = new Date()
  const limite = new Date(agora.getTime() - JANELA)
  // Faxina: registros de janelas que já acabaram não servem para nada.
  await banco.tentativaLogin.deleteMany({ where: { primeiraEm: { lt: limite } } })
  await banco.tentativaLogin.upsert({
    where: { chave },
    create: { chave, erros: 1, primeiraEm: agora },
    update: { erros: { increment: 1 } },
  })
}

export async function limparTentativas(chave: string, banco: Banco = db): Promise<void> {
  await banco.tentativaLogin.deleteMany({ where: { chave } })
}
