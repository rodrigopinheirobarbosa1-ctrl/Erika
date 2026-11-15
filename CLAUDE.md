# Site/sistema da Érika Dias (psicóloga) — instruções para o Claude

Estrutura dos apps do usuário (Next.js 16 App Router + server actions + Prisma 6 +
PostgreSQL/Neon na Vercel, região gru1). **Referência preferida: Mathima**
(`rodrigopinheirobarbosa1-ctrl/Mathima`) — o usuário confia menos no Trip. Login segue o
Mathima: id da sessão = HMAC(SESSION_SECRET), tentativas no banco (`TentativaLogin`).
Diferença consciente: aqui o primeiro acesso é pela web (nada roda no computador do
usuário), protegido pela SESSION_SECRET. O usuário não é
dev: explicar passos em português, bem detalhados. Nada roda no computador dele.

- Dados de saúde (LGPD art. 11): campos `*Cripto` no schema SEMPRE passam por
  `criptografar`/`descriptografar` (`src/lib/cripto.ts`). Nunca gravar texto clínico puro.
- Nunca apagar paciente/prontuário (Resolução CFP 001/2009, guarda mínima de 5 anos): usar status.
- Abrir ficha de paciente → `auditar({ acao: 'VISUALIZAR' })`.
- Perfis (`src/lib/permissoes.ts`): ADMIN = a psicóloga; TOTAL = administrador do sistema
  (o usuário dono do app; vê tudo; só 1 ativo; a psicóloga vê aviso e pode desativar);
  ASSISTENTE = secretária, sem textos clínicos; SUPORTE = só usuários, não dá/edita
  perfis de acesso total. Sempre conferir permissão pelas funções de `permissoes.ts`.
- Prontuário (`RegistroProntuario`): NUNCA update/delete; correção = novo registro
  RETIFICACAO com `retificaId`. Só ADMIN (a psicóloga) escreve (`escreveProntuario`);
  TOTAL lê. Agenda (`Atendimento`) guarda instante UTC; telas usam `src/lib/horario.ts`
  (Brasília = UTC-3 fixo). `Atendimento.valorCentavos` é a base da Etapa 3 (financeiro).
- Financeiro: o que o paciente deve NÃO é gravado — sai das sessões (`cobravel` em
  `src/lib/financeiro.ts`: REALIZADO, ou FALTOU com `cobrarFalta`). `Pagamento` nunca é
  apagado (estorno com motivo). Recibo oficial é no app Receita Saúde: o sistema só
  marca `reciboEmitido`. Secretária registra pagamentos; resumo/despesas/relatório só
  ADMIN e TOTAL (`veFinanceiro`).
- Ficha de anamnese (`FichaAnamnese`, página pública `/ficha/[token]`): modelo em
  `src/lib/anamnese/modelo.ts`, VERSIONADO — para mudar perguntas, criar nova versão,
  nunca editar uma já usada. Token aleatório, uso único, 15 dias; respostas em JSON
  criptografado, nunca alteradas depois de enviadas. Secretária gera/envia o link, mas só
  ADMIN/TOTAL leem as respostas.
- Mensagens ao paciente (`ModeloMensagem`/`EnvioMensagem`): envio COM UM TOQUE (link
  wa.me), não automático — decisão do usuário; automático exigiria API oficial do
  WhatsApp Business + cron frequente. Modelos padrão com ids fixos (`garantirModelos`).
  `lembretesPendentes` mostra só o lembrete mais próximo de cada sessão.
- Videochamada: sala FIXA por paciente (`Paciente.salaVideo`), criada sozinha (Jitsi,
  `src/lib/video.ts`, nome aleatório sem dados do paciente) na 1ª sessão online.
  `Atendimento.linkOnline` só quando a sessão tem link próprio; exibir sempre via
  `linkDaSessao(linkOnline, salaVideo)`.
- Enums do Prisma: usar os nomes (`'PRESENCIAL'`), valores em CENTAVOS, datas de calendário à meia-noite UTC.
- O repositório é PÚBLICO: nunca commitar dados reais, documentos ou chaves.
- Divulgação de psicólogo (CFP): sempre mostrar nome + CRP; não usar depoimentos de
  pacientes nem prometer resultados.
- Mudança de tabela: alterar `prisma/schema.prisma` e `npx prisma migrate dev --name descricao`.
- Verificação: `npm test && npm run typecheck && npm run build`.

## Mapa dos apps do usuário (nada roda no computador dele)

Todos na **Vercel** (uma conta, região gru1), cada um com **seu próprio banco Neon**
(instalação Neon via Vercel, plano **Launch**, pago por uso). Não presumir PC, Windows,
SQLite ou Tailscale. Cada app tem os próprios usuários (não há login compartilhado).

| App | Repositório | Observação |
|---|---|---|
| CEG | `ceg-app` (ramo padrão `vercel-neon`) | FastAPI + React; finanças pessoais |
| Mathima | `Mathima` | Next.js + Prisma; **referência preferida** |
| Mogno | `mogno-painel` | |
| Trip | `Trip` | Next.js + Prisma; o usuário confia menos |
| Érika (este) | `Erika` | banco Neon `erika`, dados de saúde |
