import type { Role } from '../../generated/prisma/enums.js';

// Identidade resolvida a partir do JWT do Supabase Auth + tabela de perfil
// correspondente (Usuario/Funcionario/Gestor). Anexada a `request.user` pelo
// SupabaseAuthGuard e usada por toda a aplicacao para autorizacao e filtros
// de predio_id — nunca confiar em predio_id vindo de query/body do cliente.
export interface AuthUser {
  authUserId: string;
  email: string;
  role: Role;
  perfilId: string;
  nomeCompleto: string;
  predioIds: string[];
}
