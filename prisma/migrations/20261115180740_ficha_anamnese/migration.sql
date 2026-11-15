-- CreateEnum
CREATE TYPE "StatusFicha" AS ENUM ('PENDENTE', 'RESPONDIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "FichaAnamnese" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "modeloVersao" INTEGER NOT NULL,
    "status" "StatusFicha" NOT NULL DEFAULT 'PENDENTE',
    "preCadastroId" TEXT,
    "pacienteId" TEXT,
    "nomeDestinatario" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "respostasCripto" TEXT,
    "respondidaEm" TIMESTAMP(3),
    "consentimentoEm" TIMESTAMP(3),
    "ip" TEXT,
    "enviadaPorNome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaAnamnese_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FichaAnamnese_token_key" ON "FichaAnamnese"("token");

-- CreateIndex
CREATE INDEX "FichaAnamnese_status_criadoEm_idx" ON "FichaAnamnese"("status", "criadoEm");

-- CreateIndex
CREATE INDEX "FichaAnamnese_pacienteId_idx" ON "FichaAnamnese"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaAnamnese_preCadastroId_idx" ON "FichaAnamnese"("preCadastroId");

-- AddForeignKey
ALTER TABLE "FichaAnamnese" ADD CONSTRAINT "FichaAnamnese_preCadastroId_fkey" FOREIGN KEY ("preCadastroId") REFERENCES "PreCadastro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAnamnese" ADD CONSTRAINT "FichaAnamnese_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
