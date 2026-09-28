-- Foto, capacidade maxima, horario de funcionamento e regras das areas
-- sociais (exibidos tambem no card de reserva).
ALTER TABLE "areas_sociais" ADD COLUMN     "capacidade_maxima" INTEGER,
ADD COLUMN     "foto_url" TEXT,
ADD COLUMN     "horario_funcionamento" TEXT,
ADD COLUMN     "regras" TEXT;
