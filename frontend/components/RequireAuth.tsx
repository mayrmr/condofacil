'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';

export function RequireAuth({ children, papeis }: { children: ReactNode; papeis?: Role[] }) {
  const { session, perfil, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !session) {
      router.replace('/login');
    }
  }, [carregando, session, router]);

  if (carregando) {
    return <p className="muted">Carregando...</p>;
  }
  if (!session || !perfil) {
    return null;
  }
  if (papeis && perfil.role && !papeis.includes(perfil.role)) {
    return <p className="erro">Você não tem permissão para acessar esta página.</p>;
  }

  return <>{children}</>;
}
