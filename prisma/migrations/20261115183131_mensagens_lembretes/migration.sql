-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('AGENDAMENTO', 'LEMBRETE');

-- CreateTable
CREATE TABLE "ModeloMensagem" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMensagem" NOT NULL,
    "nome" TEXT NOT NULL,
    "antecedenciaMin" INTEGER,
    "texto" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvioMensagem" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "modeloId" TEXT,
    "pulado" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPorNome" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvioMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnvioMensagem_enviadoEm_idx" ON "EnvioMensagem"("enviadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "EnvioMensagem_atendimentoId_modeloId_key" ON "EnvioMensagem"("atendimentoId", "modeloId");

-- AddForeignKey
ALTER TABLE "EnvioMensagem" ADD CONSTRAINT "EnvioMensagem_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioMensagem" ADD CONSTRAINT "EnvioMensagem_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloMensagem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
