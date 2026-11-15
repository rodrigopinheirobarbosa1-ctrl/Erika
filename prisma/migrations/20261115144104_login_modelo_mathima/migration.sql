-- CreateTable
CREATE TABLE "TentativaLogin" (
    "chave" TEXT NOT NULL,
    "erros" INTEGER NOT NULL,
    "primeiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativaLogin_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE INDEX "TentativaLogin_primeiraEm_idx" ON "TentativaLogin"("primeiraEm");

-- CreateIndex
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");
