-- Permite registrar encomenda pra quem nao tem cadastro na plataforma:
-- usuario_id vira opcional, com campos manuais de destinatario/bloco/apto.
ALTER TABLE "encomendas" DROP CONSTRAINT "encomendas_usuario_id_fkey";

ALTER TABLE "encomendas" ADD COLUMN     "apartamento_id" TEXT,
ADD COLUMN     "bloco_id" TEXT,
ADD COLUMN     "nome_destinatario" TEXT,
ALTER COLUMN "usuario_id" DROP NOT NULL;

ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_bloco_id_fkey" FOREIGN KEY ("bloco_id") REFERENCES "blocos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_apartamento_id_fkey" FOREIGN KEY ("apartamento_id") REFERENCES "apartamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
