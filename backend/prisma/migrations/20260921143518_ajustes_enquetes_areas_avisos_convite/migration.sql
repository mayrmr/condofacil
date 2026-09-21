-- CreateEnum
CREATE TYPE "LocalizacaoTipoAviso" AS ENUM ('AREA_SOCIAL', 'BLOCO', 'GERAL');

-- CreateEnum
CREATE TYPE "DestinatarioAviso" AS ENUM ('TODOS', 'BLOCO');

-- AlterTable: areas_sociais passa a acumular os campos de area reservavel.
ALTER TABLE "areas_sociais" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "descricao" TEXT;

-- Copia as areas_reservaveis existentes para areas_sociais (mesmo id, para
-- que reservas.area_id continue apontando para a linha certa) antes de
-- remover a tabela antiga.
INSERT INTO "areas_sociais" ("id", "predio_id", "nome", "descricao", "ativa")
SELECT "id", "predio_id", "nome", "descricao", "ativa" FROM "areas_reservaveis"
ON CONFLICT ("id") DO NOTHING;

-- DropForeignKey
ALTER TABLE "areas_reservaveis" DROP CONSTRAINT "areas_reservaveis_predio_id_fkey";

-- DropForeignKey
ALTER TABLE "enquetes" DROP CONSTRAINT "enquetes_gestor_id_fkey";

-- DropForeignKey
ALTER TABLE "enquetes" DROP CONSTRAINT "enquetes_predio_id_fkey";

-- DropForeignKey
ALTER TABLE "opcoes_enquete" DROP CONSTRAINT "opcoes_enquete_enquete_id_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_area_id_fkey";

-- DropForeignKey
ALTER TABLE "votos_enquete" DROP CONSTRAINT "votos_enquete_enquete_id_fkey";

-- DropForeignKey
ALTER TABLE "votos_enquete" DROP CONSTRAINT "votos_enquete_opcao_id_fkey";

-- AlterTable: avisos ganha destinatario (todos/bloco) e tipo de local proprio
-- (sem apartamento, com "geral"); tabela vazia em producao, sem risco de dado.
ALTER TABLE "avisos" ADD COLUMN     "destinatario_bloco_id" TEXT,
ADD COLUMN     "destinatario_tipo" "DestinatarioAviso" NOT NULL DEFAULT 'TODOS',
DROP COLUMN "localizacao_tipo",
ADD COLUMN     "localizacao_tipo" "LocalizacaoTipoAviso" NOT NULL,
ALTER COLUMN "localizacao_id" DROP NOT NULL;

-- AlterTable: imagens passa a ser polimorfica (ocorrencia OU aviso).
ALTER TABLE "imagens" ADD COLUMN     "aviso_id" TEXT,
ALTER COLUMN "ocorrencia_id" DROP NOT NULL;

-- AlterTable: codigo_convite nasce nullable para poder ser preenchido nas
-- linhas ja existentes antes de virar NOT NULL + UNIQUE.
ALTER TABLE "predios" ADD COLUMN     "codigo_convite" TEXT;

UPDATE "predios" SET "codigo_convite" = upper(substr(md5(random()::text || "id"), 1, 8))
WHERE "codigo_convite" IS NULL;

ALTER TABLE "predios" ALTER COLUMN "codigo_convite" SET NOT NULL;

-- DropTable
DROP TABLE "areas_reservaveis";

-- DropTable
DROP TABLE "enquetes";

-- DropTable
DROP TABLE "opcoes_enquete";

-- DropTable
DROP TABLE "votos_enquete";

-- DropEnum
DROP TYPE "StatusEnquete";

-- CreateIndex
CREATE INDEX "imagens_ocorrencia_id_idx" ON "imagens"("ocorrencia_id");

-- CreateIndex
CREATE INDEX "imagens_aviso_id_idx" ON "imagens"("aviso_id");

-- CreateIndex
CREATE UNIQUE INDEX "predios_codigo_convite_key" ON "predios"("codigo_convite");

-- AddForeignKey
ALTER TABLE "imagens" ADD CONSTRAINT "imagens_aviso_id_fkey" FOREIGN KEY ("aviso_id") REFERENCES "avisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_sociais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
