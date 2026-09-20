'use client';

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do navegador: usado para login/registro (auth.signUp,
// signInWithPassword) e para assinar mudancas em tempo real (Realtime) nas
// tabelas ocorrencias/comentarios/avisos, filtrado por predio_id via as
// policies de RLS (ver backend/prisma/sql/rls.sql) — nunca para acessar o
// banco diretamente fora dessas duas finalidades.
//
// Os fallbacks abaixo so existem para o build (`next build` prerenderiza
// paginas como /_not-found, que importam este modulo) nao quebrar quando as
// env vars ainda nao foram configuradas; em runtime no navegador, sem as
// env vars reais (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) nenhuma chamada de auth
// funciona de verdade.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
);
