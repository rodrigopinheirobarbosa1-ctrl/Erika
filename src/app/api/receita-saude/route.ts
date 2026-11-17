import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/lib/auth'
import { auditar } from '@/lib/audit'
import { mesValido } from '@/lib/financeiro'
import { veFinanceiro } from '@/lib/permissoes'
import { gerarArquivo, pendencias } from '@/lib/receita-saude'
import { pagamentosSemRecibo, profissional } from '@/lib/receita-saude-servidor'

/** Baixa o arquivo de emissão em lote do Receita Saúde do mês (?mes=AAAA-MM). */
export async function GET(req: Request) {
  const usuario = await usuarioAtual()
  if (!usuario || !veFinanceiro(usuario.papel)) return new NextResponse('Sem permissão.', { status: 403 })
  const mes = new URL(req.url).searchParams.get('mes') ?? ''
  if (!mesValido(mes)) return new NextResponse('Mês inválido.', { status: 400 })

  const itens = (await pagamentosSemRecibo(mes)).map((x) => x.item).filter((i) => pendencias(i).length === 0)
  let conteudo: string
  try {
    conteudo = gerarArquivo(itens, await profissional())
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 })
  }
  await auditar({ usuario, acao: 'VISUALIZAR', entidade: 'ReceitaSaude', resumo: `Baixou o arquivo do Receita Saúde de ${mes} (${itens.length} recibos)` })
  return new NextResponse(conteudo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="receita-saude-${mes}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
