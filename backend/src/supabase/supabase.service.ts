import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Dois clientes Supabase com propositos distintos:
// - `anon`: usado para operacoes em nome do proprio usuario (login,
//   validacao de token via getUser) — respeita RLS/Auth normalmente.
// - `admin`: usa a service role key, ignora RLS. So deve ser usado em rotas
//   de servidor bem controladas (criacao de usuario no auto-cadastro,
//   criacao de convite, criacao de conta ao aceitar convite).
@Injectable()
export class SupabaseService {
  readonly anon: SupabaseClient;
  readonly admin: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
