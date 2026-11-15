# Site/sistema da Érika Dias (psicóloga) — instruções para o Claude

Mesma estrutura do Trip (`rodrigopinheirobarbosa1-ctrl/Trip`): Next.js 16 (App Router,
server actions) + Prisma 6 + PostgreSQL (Neon) na Vercel (região gru1). O usuário não é
dev: explicar passos em português, bem detalhados. Nada roda no computador dele.

- Dados de saúde (LGPD art. 11): campos `*Cripto` no schema SEMPRE passam por
  `criptografar`/`descriptografar` (`src/lib/cripto.ts`). Nunca gravar texto clínico puro.
- Nunca apagar paciente/prontuário (Resolução CFP 001/2009, guarda mínima de 5 anos): usar status.
- Abrir ficha de paciente → `auditar({ acao: 'VISUALIZAR' })`.
- Enums do Prisma: usar os nomes (`'PRESENCIAL'`), valores em CENTAVOS, datas de calendário à meia-noite UTC.
- O repositório é PÚBLICO: nunca commitar dados reais, documentos ou chaves.
- Divulgação de psicólogo (CFP): sempre mostrar nome + CRP; não usar depoimentos de
  pacientes nem prometer resultados.
- Mudança de tabela: alterar `prisma/schema.prisma` e `npx prisma migrate dev --name descricao`.
- Verificação: `npm test && npm run typecheck && npm run build`.
