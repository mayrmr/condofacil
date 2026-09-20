import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca uma rota como isenta do SupabaseAuthGuard (ex: login, registro,
// aceitar convite).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
