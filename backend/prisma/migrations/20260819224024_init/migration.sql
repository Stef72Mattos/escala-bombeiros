-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ESCALANTE', 'BOMBEIRO');

-- CreateEnum
CREATE TYPE "public"."BombeiroStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "public"."TipoFeriado" AS ENUM ('NACIONAL', 'ESTADUAL', 'LOCAL');

-- CreateEnum
CREATE TYPE "public"."TipoEscala" AS ENUM ('PRETA', 'VERMELHA');

-- CreateEnum
CREATE TYPE "public"."StatusEscala" AS ENUM ('RASCUNHO', 'APROVADA', 'PUBLICADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "public"."OrigemPlantao" AS ENUM ('AUTOMATICA', 'MANUAL', 'SUBSTITUICAO');

-- CreateEnum
CREATE TYPE "public"."StatusIndisponibilidade" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "public"."TipoNotificacao" AS ENUM ('ESCALA_PUBLICADA', 'ALTERACAO_PLANTAO', 'SUBSTITUICAO', 'ATESTADO', 'FERIAS', 'ALERTA');

-- CreateEnum
CREATE TYPE "public"."TipoAuditoria" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'PUBLISH', 'SUBSTITUTE', 'LOGIN');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bombeiros" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "telefone" TEXT,
    "data_admissao" TIMESTAMP(3) NOT NULL,
    "status" "public"."BombeiroStatus" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bombeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feriados" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "public"."TipoFeriado" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feriados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ferias" (
    "id" TEXT NOT NULL,
    "bombeiro_id" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ferias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."atestados" (
    "id" TEXT NOT NULL,
    "bombeiro_id" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "arquivo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atestados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."indisponibilidades" (
    "id" TEXT NOT NULL,
    "bombeiro_id" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "status" "public"."StatusIndisponibilidade" NOT NULL DEFAULT 'PENDENTE',
    "avaliado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indisponibilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."escalas" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "status" "public"."StatusEscala" NOT NULL DEFAULT 'RASCUNHO',
    "gerada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprovada_por" TEXT,
    "aprovada_em" TIMESTAMP(3),
    "publicada_em" TIMESTAMP(3),
    "versao" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "escalas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plantoes" (
    "id" TEXT NOT NULL,
    "escala_id" TEXT NOT NULL,
    "bombeiro_id" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "tipo" "public"."TipoEscala" NOT NULL,
    "origem" "public"."OrigemPlantao" NOT NULL,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."substituicoes" (
    "id" TEXT NOT NULL,
    "plantao_id" TEXT NOT NULL,
    "bombeiro_original_id" TEXT NOT NULL,
    "bombeiro_substituto_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "confirmada_por" TEXT NOT NULL,
    "confirmada_em" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "substituicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificacoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "public"."TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "acao" "public"."TipoAuditoria" NOT NULL,
    "payload_antes" JSONB,
    "payload_depois" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historico_plantoes" (
    "id" TEXT NOT NULL,
    "bombeiro_id" TEXT NOT NULL,
    "plantao_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "public"."TipoEscala" NOT NULL,
    "ano_mes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_plantoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "public"."refresh_tokens"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "bombeiros_usuario_id_key" ON "public"."bombeiros"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "bombeiros_matricula_key" ON "public"."bombeiros"("matricula");

-- CreateIndex
CREATE INDEX "bombeiros_status_idx" ON "public"."bombeiros"("status");

-- CreateIndex
CREATE UNIQUE INDEX "feriados_data_key" ON "public"."feriados"("data");

-- CreateIndex
CREATE INDEX "feriados_data_idx" ON "public"."feriados"("data");

-- CreateIndex
CREATE INDEX "ferias_bombeiro_id_idx" ON "public"."ferias"("bombeiro_id");

-- CreateIndex
CREATE INDEX "ferias_data_inicio_data_fim_idx" ON "public"."ferias"("data_inicio", "data_fim");

-- CreateIndex
CREATE INDEX "atestados_bombeiro_id_idx" ON "public"."atestados"("bombeiro_id");

-- CreateIndex
CREATE INDEX "atestados_data_inicio_data_fim_idx" ON "public"."atestados"("data_inicio", "data_fim");

-- CreateIndex
CREATE INDEX "indisponibilidades_bombeiro_id_idx" ON "public"."indisponibilidades"("bombeiro_id");

-- CreateIndex
CREATE INDEX "indisponibilidades_status_idx" ON "public"."indisponibilidades"("status");

-- CreateIndex
CREATE INDEX "escalas_ano_mes_idx" ON "public"."escalas"("ano", "mes");

-- CreateIndex
CREATE INDEX "escalas_status_idx" ON "public"."escalas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escalas_ano_mes_versao_key" ON "public"."escalas"("ano", "mes", "versao");

-- CreateIndex
CREATE INDEX "plantoes_bombeiro_id_idx" ON "public"."plantoes"("bombeiro_id");

-- CreateIndex
CREATE INDEX "plantoes_data_inicio_idx" ON "public"."plantoes"("data_inicio");

-- CreateIndex
CREATE INDEX "plantoes_tipo_idx" ON "public"."plantoes"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "plantoes_escala_id_data_inicio_key" ON "public"."plantoes"("escala_id", "data_inicio");

-- CreateIndex
CREATE INDEX "substituicoes_plantao_id_idx" ON "public"."substituicoes"("plantao_id");

-- CreateIndex
CREATE INDEX "notificacoes_usuario_id_idx" ON "public"."notificacoes"("usuario_id");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "public"."notificacoes"("lida");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "public"."auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "historico_plantoes_bombeiro_id_tipo_data_idx" ON "public"."historico_plantoes"("bombeiro_id", "tipo", "data");

-- CreateIndex
CREATE INDEX "historico_plantoes_ano_mes_idx" ON "public"."historico_plantoes"("ano_mes");

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bombeiros" ADD CONSTRAINT "bombeiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ferias" ADD CONSTRAINT "ferias_bombeiro_id_fkey" FOREIGN KEY ("bombeiro_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."atestados" ADD CONSTRAINT "atestados_bombeiro_id_fkey" FOREIGN KEY ("bombeiro_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indisponibilidades" ADD CONSTRAINT "indisponibilidades_bombeiro_id_fkey" FOREIGN KEY ("bombeiro_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indisponibilidades" ADD CONSTRAINT "indisponibilidades_avaliado_por_fkey" FOREIGN KEY ("avaliado_por") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."escalas" ADD CONSTRAINT "escalas_aprovada_por_fkey" FOREIGN KEY ("aprovada_por") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plantoes" ADD CONSTRAINT "plantoes_escala_id_fkey" FOREIGN KEY ("escala_id") REFERENCES "public"."escalas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plantoes" ADD CONSTRAINT "plantoes_bombeiro_id_fkey" FOREIGN KEY ("bombeiro_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."substituicoes" ADD CONSTRAINT "substituicoes_plantao_id_fkey" FOREIGN KEY ("plantao_id") REFERENCES "public"."plantoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."substituicoes" ADD CONSTRAINT "substituicoes_bombeiro_original_id_fkey" FOREIGN KEY ("bombeiro_original_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."substituicoes" ADD CONSTRAINT "substituicoes_bombeiro_substituto_id_fkey" FOREIGN KEY ("bombeiro_substituto_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."substituicoes" ADD CONSTRAINT "substituicoes_confirmada_por_fkey" FOREIGN KEY ("confirmada_por") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_plantoes" ADD CONSTRAINT "historico_plantoes_bombeiro_id_fkey" FOREIGN KEY ("bombeiro_id") REFERENCES "public"."bombeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_plantoes" ADD CONSTRAINT "historico_plantoes_plantao_id_fkey" FOREIGN KEY ("plantao_id") REFERENCES "public"."plantoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
