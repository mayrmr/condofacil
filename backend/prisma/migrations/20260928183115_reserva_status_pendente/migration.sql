-- Adiciona o status PENDENTE, usado para reservas aguardando aprovacao do
-- gestor (antes toda reserva nascia direto CONFIRMADA).
ALTER TYPE "StatusReserva" ADD VALUE 'PENDENTE';
