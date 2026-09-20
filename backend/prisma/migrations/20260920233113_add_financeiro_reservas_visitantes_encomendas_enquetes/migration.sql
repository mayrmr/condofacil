-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('EM_ABERTO', 'PAGA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusVisitante" AS ENUM ('AUTORIZADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "StatusEncomenda" AS ENUM ('AGUARDANDO_RETIRADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "StatusEnquete" AS ENUM ('ATIVA', 'ENCERRADA');

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusFatura" NOT NULL DEFAULT 'EM_ABERTO',
    "pago_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_reservaveis" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_reservaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitantes" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "data_visita" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "status" "StatusVisitante" NOT NULL DEFAULT 'AUTORIZADO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encomendas" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusEncomenda" NOT NULL DEFAULT 'AGUARDANDO_RETIRADA',
    "chegada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retirada_em" TIMESTAMP(3),
    "registrado_por_id" TEXT,

    CONSTRAINT "encomendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquetes" (
    "id" TEXT NOT NULL,
    "predio_id" TEXT NOT NULL,
    "gestor_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusEnquete" NOT NULL DEFAULT 'ATIVA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_enquete" (
    "id" TEXT NOT NULL,
    "enquete_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "opcoes_enquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_enquete" (
    "id" TEXT NOT NULL,
    "enquete_id" TEXT NOT NULL,
    "opcao_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "autor_tipo" "AutorTipo" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_enquete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faturas_predio_id_idx" ON "faturas"("predio_id");

-- CreateIndex
CREATE INDEX "faturas_usuario_id_idx" ON "faturas"("usuario_id");

-- CreateIndex
CREATE INDEX "areas_reservaveis_predio_id_idx" ON "areas_reservaveis"("predio_id");

-- CreateIndex
CREATE INDEX "reservas_predio_id_idx" ON "reservas"("predio_id");

-- CreateIndex
CREATE INDEX "reservas_area_id_idx" ON "reservas"("area_id");

-- CreateIndex
CREATE INDEX "reservas_usuario_id_idx" ON "reservas"("usuario_id");

-- CreateIndex
CREATE INDEX "visitantes_predio_id_idx" ON "visitantes"("predio_id");

-- CreateIndex
CREATE INDEX "visitantes_usuario_id_idx" ON "visitantes"("usuario_id");

-- CreateIndex
CREATE INDEX "encomendas_predio_id_idx" ON "encomendas"("predio_id");

-- CreateIndex
CREATE INDEX "encomendas_usuario_id_idx" ON "encomendas"("usuario_id");

-- CreateIndex
CREATE INDEX "enquetes_predio_id_idx" ON "enquetes"("predio_id");

-- CreateIndex
CREATE UNIQUE INDEX "votos_enquete_enquete_id_autor_id_key" ON "votos_enquete"("enquete_id", "autor_id");

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_reservaveis" ADD CONSTRAINT "areas_reservaveis_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_reservaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitantes" ADD CONSTRAINT "visitantes_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitantes" ADD CONSTRAINT "visitantes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquetes" ADD CONSTRAINT "enquetes_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquetes" ADD CONSTRAINT "enquetes_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "gestores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_enquete" ADD CONSTRAINT "opcoes_enquete_enquete_id_fkey" FOREIGN KEY ("enquete_id") REFERENCES "enquetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_enquete_id_fkey" FOREIGN KEY ("enquete_id") REFERENCES "enquetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_opcao_id_fkey" FOREIGN KEY ("opcao_id") REFERENCES "opcoes_enquete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
