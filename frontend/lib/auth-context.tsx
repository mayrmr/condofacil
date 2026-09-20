'use client';

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import { supabase } from './supabase-client';
import type { Perfil } from './types';

interface AuthContextValue {
  session: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil() {
    try {
      const dados = await api.get<Perfil>('/usuarios/me');
      setPerfil(dados);
    } catch {
      setPerfil(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        await carregarPerfil();
      }
      setCarregando(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, novaSessao) => {
      setSession(novaSessao);
      if (novaSessao) {
        await carregarPerfil();
      } else {
        setPerfil(null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    setPerfil(null);
  }

  return (
    <AuthContext.Provider value={{ session, perfil, carregando, recarregarPerfil: carregarPerfil, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }
  return ctx;
}
