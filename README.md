# Érika Dias · Psicóloga — site e sistema do consultório

Site público (apresentação + formulário "Agende sua consulta") e área restrita
(`/sistema`) para a psicóloga cadastrar e acompanhar pacientes.

Mesma estrutura dos outros apps: **Next.js + Prisma + PostgreSQL (Neon) na Vercel**,
com o **mesmo modelo de login do Mathima** (sessão protegida por `SESSION_SECRET`,
tentativas erradas contadas no banco). Não roda no computador: só na nuvem, pelo navegador.

| Parte | O que tem |
|---|---|
| Site (`/`) | Gestação, Puerpério, Parentalidade, Saúde mental, sinais do pós-parto, como funciona, sobre mim, formulário de contato |
| Pedidos de contato | O que chega do formulário do site; responder pelo WhatsApp em 1 toque; virar paciente |
| Pacientes | Cadastro completo (contato, responsável legal, modalidade, valor da sessão, queixa inicial) |
| Histórico de acessos | Quem entrou, abriu ou alterou cada ficha |

**Próximas etapas:** agenda e prontuário das sessões → financeiro (a receber) → contas a pagar.

## Segurança dos dados (são dados de saúde)

- Banco **só da Érika**, separado do Trip/Mathima.
- Queixa, motivo da procura e observações ficam **criptografados** no banco
  (chave `CHAVE_CRIPTOGRAFIA`, que só existe na Vercel).
- Login no modelo do Mathima: senha (mín. 10 caracteres), sessão de 1 dia guardada só como
  "impressão digital", bloqueio após 8 erros do mesmo endereço ou 30 no mesmo e-mail (contados no banco).
- Tela de primeiro acesso exige a chave de instalação (`SESSION_SECRET`).
- Toda abertura de ficha fica registrada no histórico.
- Nada de paciente é apagado (registro documental: Resolução CFP 001/2009).

---

## Publicar na internet (Vercel, plano gratuito) — passo a passo

Use a **mesma conta da Vercel** dos outros apps (entrar com o GitHub).

1. Abra <https://vercel.com> e entre (**Continue with GitHub**).
2. Clique em **Add New… → Project**.
3. Na lista de repositórios, ao lado de **Erika**, clique em **Import**.
   (Se não aparecer: **Adjust GitHub App Permissions** → marque o repositório **Erika** → **Save**.)
4. **Antes de clicar em Deploy**, abra **Environment Variables** e adicione DUAS variáveis
   (para cada uma: preencha Name e Value e clique em **Add**):

   | Name | Value |
   |---|---|
   | `SESSION_SECRET` | uma frase longa inventada, **32 caracteres ou mais** |
   | `CHAVE_CRIPTOGRAFIA` | OUTRA frase longa inventada, **32 caracteres ou mais**, diferente da primeira |

   Exemplo de formato: `girassol-7-trem-azul-42-chuva-mar-19` (não use este!).
   **Guarde as duas num lugar seguro** (gerenciador de senhas):
   - a `SESSION_SECRET` é pedida na tela de primeiro acesso (passo 8);
   - a `CHAVE_CRIPTOGRAFIA`, se for perdida ou trocada, torna as anotações dos
     pacientes ilegíveis para sempre.
5. Clique em **Deploy**. Ele vai **falhar** dizendo "Banco de dados não configurado" — é esperado.
6. No projeto, abra a aba **Storage → Create Database → Neon** (plano Free).
   Região: **São Paulo (gru1)**. Confirme e clique em **Connect** ao projeto **Erika**.
7. Aba **Deployments** → no último deploy, **⋯ → Redeploy**. Agora vai dar certo.
8. Abra o endereço do site (algo como `erika-xxxx.vercel.app`), clique em
   **Área restrita** no rodapé (ou vá em `/sistema`) e crie o acesso da Érika.
   A tela pede a **chave de instalação**: é a frase da `SESSION_SECRET`.
   Ela só aparece uma vez, enquanto não existe nenhum usuário.

Toda alteração enviada ao GitHub (branch principal) é publicada sozinha pela Vercel.

### Endereço próprio (opcional)

Para usar um domínio (ex.: `erikadias.psi.br` ou `erika.mathimagestao.com.br`):
Vercel → projeto → **Settings → Domains → Add** e siga as instruções de DNS.

### Trocar WhatsApp / Instagram / e-mail do site

Edite `src/lib/site.ts` (campos vazios não aparecem no site).

---

## Para quem for mexer no código

```bash
npm install
npm run dev        # cria o .env, as tabelas e abre em http://localhost:3000
npm test           # testes (criptografia, formatos)
npm run typecheck
```

- `src/app/page.tsx` — site público
- `src/app/sistema/` — área restrita
- `prisma/schema.prisma` — tabelas do banco
- `src/lib/cripto.ts` — criptografia dos textos sensíveis
