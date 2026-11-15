/**
 * Build usado na Vercel (e no "npm run build"). Junta os nomes de variáveis
 * de banco dos vários provedores, cria/atualiza as tabelas e gera o site.
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolverEnderecosDoBanco } from './banco.mjs'

if (existsSync('.env')) process.loadEnvFile('.env')

const env = resolverEnderecosDoBanco(process.env)
if (!env.DATABASE_URL) {
  console.error(
    '\n*** Banco de dados não configurado. ***\n' +
      'Na Vercel: abra o projeto > aba Storage > crie ou conecte um banco Postgres (Neon) e depois clique em Redeploy.\n',
  )
  process.exit(1)
}
const sessao = env.SESSION_SECRET ?? ''
if (sessao.length < 32 || sessao.startsWith('troque-por')) {
  console.error(
    '\n*** Falta a SESSION_SECRET (uma frase com 32 caracteres ou mais). ***\n' +
      'Na Vercel: Settings > Environment Variables > Add. Veja o passo a passo no README.\n',
  )
  process.exit(1)
}
if (sessao === env.CHAVE_CRIPTOGRAFIA) {
  console.error('\n*** SESSION_SECRET e CHAVE_CRIPTOGRAFIA precisam ser frases DIFERENTES. ***\n')
  process.exit(1)
}
const chave = env.CHAVE_CRIPTOGRAFIA ?? ''
if (chave.length < 32 || chave.startsWith('troque-por')) {
  console.error(
    '\n*** Falta a CHAVE_CRIPTOGRAFIA (uma frase com 32 caracteres ou mais). ***\n' +
      'Na Vercel: Settings > Environment Variables > Add. Veja o passo a passo no README.\n',
  )
  process.exit(1)
}

const rodar = (comando) => execSync(comando, { stdio: 'inherit', env })
rodar('npx prisma generate')
rodar('npx prisma migrate deploy')
rodar('npx next build')
