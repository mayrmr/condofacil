-- Remove o modulo Financeiro (feature descontinuada). Tabela vazia em
-- producao, sem risco de dado.
ALTER TABLE "faturas" DROP CONSTRAINT "faturas_predio_id_fkey";
ALTER TABLE "faturas" DROP CONSTRAINT "faturas_usuario_id_fkey";
DROP TABLE "faturas";
DROP TYPE "StatusFatura";

-- Corrige uma lacuna de uma migracao anterior que foi interrompida no meio
-- (ver historico): predios.codigo_convite tinha @unique no schema mas nunca
-- ganhou o indice unico de verdade no banco.
CREATE UNIQUE INDEX "predios_codigo_convite_key" ON "predios"("codigo_convite");
