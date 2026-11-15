-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('SALA', 'CONSELHO', 'SUPERVISAO', 'FORMACAO', 'MATERIAL', 'DIVULGACAO', 'IMPOSTOS', 'TRANSPORTE', 'SISTEMAS', 'OUTROS');

-- AlterTable
ALTER TABLE "Atendimento" ADD COLUMN     "cobrarFalta" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "pagadorNome" TEXT,
    "pagadorCpf" TEXT,
    "reciboEmitido" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "estornadoEm" TIMESTAMP(3),
    "estornoMotivo" TEXT,
    "autorNome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "forma" "FormaPagamento",
    "observacao" TEXT,
    "serieId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pagamento_pacienteId_data_idx" ON "Pagamento"("pacienteId", "data");

-- CreateIndex
CREATE INDEX "Pagamento_data_idx" ON "Pagamento"("data");

-- CreateIndex
CREATE INDEX "Despesa_vencimento_idx" ON "Despesa"("vencimento");

-- CreateIndex
CREATE INDEX "Despesa_pagoEm_idx" ON "Despesa"("pagoEm");

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
