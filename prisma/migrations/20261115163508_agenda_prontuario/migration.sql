-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('AGENDADO', 'REALIZADO', 'FALTOU', 'DESMARCADO_PACIENTE', 'DESMARCADO_PSICOLOGA');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('EVOLUCAO', 'ANOTACAO', 'RETIFICACAO');

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 50,
    "modalidade" "Modalidade" NOT NULL,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'AGENDADO',
    "linkOnline" TEXT,
    "recado" TEXT,
    "valorCentavos" INTEGER,
    "serieId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroProntuario" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "atendimentoId" TEXT,
    "tipo" "TipoRegistro" NOT NULL,
    "textoCripto" TEXT NOT NULL,
    "retificaId" TEXT,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroProntuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Atendimento_inicio_idx" ON "Atendimento"("inicio");

-- CreateIndex
CREATE INDEX "Atendimento_pacienteId_inicio_idx" ON "Atendimento"("pacienteId", "inicio");

-- CreateIndex
CREATE INDEX "RegistroProntuario_pacienteId_criadoEm_idx" ON "RegistroProntuario"("pacienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "RegistroProntuario_atendimentoId_idx" ON "RegistroProntuario"("atendimentoId");

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProntuario" ADD CONSTRAINT "RegistroProntuario_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProntuario" ADD CONSTRAINT "RegistroProntuario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProntuario" ADD CONSTRAINT "RegistroProntuario_retificaId_fkey" FOREIGN KEY ("retificaId") REFERENCES "RegistroProntuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
