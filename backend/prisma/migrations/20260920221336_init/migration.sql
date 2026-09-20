-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USUARIO', 'FUNCIONARIO', 'GESTOR');

-- CreateEnum
CREATE TYPE "LocalizacaoTipo" AS ENUM ('BLOCO', 'APARTAMENTO', 'AREA_SOCIAL');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('ABERTURA', 'ANALISE', 'ATENDIMENTO', 'AGUARDA_MATERIAL', 'RESOLVIDA', 'CANCELAMENTO', 'AVALIACAO', 'EXCLUIDA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusAviso" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "AutorTipo" AS ENUM ('USUARIO', 'FUNCIONARIO', 'GESTOR');

-- CreateEnum
CREATE TYPE "StatusConvite" AS ENUM ('PENDENTE', 'ACEITO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predios" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocos" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "blocos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartamentos" (
    "id" TEXT NOT NULL,
    "bloco_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,

    CONSTRAINT "apartamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_sociais" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "areas_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "apartamento_id" TEXT,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "foto_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "foto_url" TEXT,
    "area" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestores" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "foto_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gestores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios_predios" (
    "funcionario_id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,

    CONSTRAINT "funcionarios_predios_pkey" PRIMARY KEY ("funcionario_id","predio_id")
);

-- CreateTable
CREATE TABLE "gestores_predios" (
    "gestor_id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,

    CONSTRAINT "gestores_predios_pkey" PRIMARY KEY ("gestor_id","predio_id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "criado_por_usuario_id" TEXT NOT NULL,
    "responsavel_funcionario_id" TEXT,
    "gestor_analise_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "localizacao_tipo" "LocalizacaoTipo" NOT NULL,
    "localizacao_id" TEXT NOT NULL,
    "prioridade" "Prioridade",
    "status_atual" "StatusOcorrencia" NOT NULL DEFAULT 'ABERTURA',
    "solucao_aplicada" TEXT,
    "observacoes_gestao" TEXT,
    "observacoes_funcionario" TEXT,
    "avaliacao_nota" INTEGER,
    "avaliacao_comentario" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_status" (
    "id" TEXT NOT NULL,
    "ocorrencia_id" TEXT NOT NULL,
    "status_anterior" "StatusOcorrencia",
    "status_novo" "StatusOcorrencia" NOT NULL,
    "usuario_responsavel_id" TEXT NOT NULL,
    "autor_tipo" "AutorTipo" NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "ocorrencia_id" TEXT,
    "aviso_id" TEXT,
    "autor_id" TEXT NOT NULL,
    "autor_tipo" "AutorTipo" NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagens" (
    "id" TEXT NOT NULL,
    "ocorrencia_id" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,

    CONSTRAINT "imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "gestor_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "localizacao_tipo" "LocalizacaoTipo" NOT NULL,
    "localizacao_id" TEXT NOT NULL,
    "status" "StatusAviso" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "predio_ids" TEXT[],
    "area" TEXT,
    "token_hash" TEXT NOT NULL,
    "status" "StatusConvite" NOT NULL DEFAULT 'PENDENTE',
    "criado_por_gestor_id" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_auth_user_id_key" ON "usuarios"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_predio_id_idx" ON "usuarios"("predio_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_auth_user_id_key" ON "funcionarios"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_email_key" ON "funcionarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_auth_user_id_key" ON "gestores"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gestores_email_key" ON "gestores"("email");

-- CreateIndex
CREATE INDEX "ocorrencias_predio_id_idx" ON "ocorrencias"("predio_id");

-- CreateIndex
CREATE INDEX "ocorrencias_status_atual_idx" ON "ocorrencias"("status_atual");

-- CreateIndex
CREATE INDEX "historico_status_ocorrencia_id_idx" ON "historico_status"("ocorrencia_id");

-- CreateIndex
CREATE INDEX "comentarios_ocorrencia_id_idx" ON "comentarios"("ocorrencia_id");

-- CreateIndex
CREATE INDEX "comentarios_aviso_id_idx" ON "comentarios"("aviso_id");

-- CreateIndex
CREATE INDEX "avisos_predio_id_idx" ON "avisos"("predio_id");

-- CreateIndex
CREATE UNIQUE INDEX "convites_token_hash_key" ON "convites"("token_hash");

-- CreateIndex
CREATE INDEX "convites_email_idx" ON "convites"("email");

-- AddForeignKey
ALTER TABLE "predios" ADD CONSTRAINT "predios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocos" ADD CONSTRAINT "blocos_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartamentos" ADD CONSTRAINT "apartamentos_bloco_id_fkey" FOREIGN KEY ("bloco_id") REFERENCES "blocos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_sociais" ADD CONSTRAINT "areas_sociais_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_apartamento_id_fkey" FOREIGN KEY ("apartamento_id") REFERENCES "apartamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios_predios" ADD CONSTRAINT "funcionarios_predios_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios_predios" ADD CONSTRAINT "funcionarios_predios_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores_predios" ADD CONSTRAINT "gestores_predios_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestores_predios" ADD CONSTRAINT "gestores_predios_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_criado_por_usuario_id_fkey" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_responsavel_funcionario_id_fkey" FOREIGN KEY ("responsavel_funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_gestor_analise_id_fkey" FOREIGN KEY ("gestor_analise_id") REFERENCES "gestores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_aviso_id_fkey" FOREIGN KEY ("aviso_id") REFERENCES "avisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagens" ADD CONSTRAINT "imagens_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
