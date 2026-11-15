-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'ASSISTENTE');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('PRESENCIAL', 'ONLINE', 'DOMICILIO');

-- CreateEnum
CREATE TYPE "AreaAtendimento" AS ENUM ('GESTACAO', 'PUERPERIO', 'PARENTALIDADE', 'SAUDE_MENTAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPreCadastro" AS ENUM ('NOVO', 'EM_CONTATO', 'CONVERTIDO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "StatusPaciente" AS ENUM ('ATIVO', 'PAUSADO', 'ALTA', 'INATIVO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ASSISTENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "resumo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreCadastro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "modalidade" "Modalidade",
    "area" "AreaAtendimento",
    "melhorHorario" TEXT,
    "motivoCripto" TEXT,
    "consentimentoEm" TIMESTAMP(3) NOT NULL,
    "status" "StatusPreCadastro" NOT NULL DEFAULT 'NOVO',
    "observacaoCripto" TEXT,
    "pacienteId" TEXT,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreCadastro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeSocial" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "profissao" TEXT,
    "estadoCivil" TEXT,
    "contatoEmergencia" TEXT,
    "telefoneEmergencia" TEXT,
    "responsavelNome" TEXT,
    "responsavelCpf" TEXT,
    "responsavelTelefone" TEXT,
    "modalidade" "Modalidade",
    "area" "AreaAtendimento",
    "dataReferenciaBebe" TIMESTAMP(3),
    "comoConheceu" TEXT,
    "valorSessaoCentavos" INTEGER,
    "status" "StatusPaciente" NOT NULL DEFAULT 'ATIVO',
    "inicioAtendimento" TIMESTAMP(3),
    "queixaCripto" TEXT,
    "observacoesCripto" TEXT,
    "consentimentoLgpdEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_criadoEm_idx" ON "Auditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "Auditoria_entidade_entidadeId_idx" ON "Auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "PreCadastro_pacienteId_key" ON "PreCadastro"("pacienteId");

-- CreateIndex
CREATE INDEX "PreCadastro_status_criadoEm_idx" ON "PreCadastro"("status", "criadoEm");

-- CreateIndex
CREATE INDEX "Paciente_status_nome_idx" ON "Paciente"("status", "nome");

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreCadastro" ADD CONSTRAINT "PreCadastro_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
