'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase-client';

function FormularioRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [predioId, setPredioId] = useState(searchParams.get('predioId') ?? '');
  const [apartamentoId, setApartamentoId] = useState(searchParams.get('apartamentoId') ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.post('/auth/registro', {
        nomeCompleto,
        email,
        senha,
        predioId,
        ...(apartamentoId ? { apartamentoId } : {}),
      });

      const sessao = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        senha,
      });
      const { error } = await supabase.auth.setSession({
        access_token: sessao.accessToken,
        refresh_token: sessao.refreshToken,
      });
      if (error) throw error;
      router.push('/');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="nomeCompleto">Nome completo</label>
        <input
          id="nomeCompleto"
          required
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          required
          minLength={8}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="predioId">ID do prédio</label>
        <input
          id="predioId"
          required
          value={predioId}
          onChange={(e) => setPredioId(e.target.value)}
          placeholder="Informado pelo síndico/gestor do seu condomínio"
        />
      </div>
      <div className="field">
        <label htmlFor="apartamentoId">ID do apartamento (opcional)</label>
        <input id="apartamentoId" value={apartamentoId} onChange={(e) => setApartamentoId(e.target.value)} />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
        {enviando ? 'Criando...' : 'Criar conta'}
      </button>
    </form>
  );
}

export default function RegistroPage() {
  return (
    <div className="stack" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Criar conta</h1>
      <Suspense fallback={<p className="muted">Carregando...</p>}>
        <FormularioRegistro />
      </Suspense>
      <p className="muted">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}
