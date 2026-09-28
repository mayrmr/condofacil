-- Novas reservas passam a nascer PENDENTE (aguardando aprovacao do gestor)
-- em vez de CONFIRMADA direto.
ALTER TABLE "reservas" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
