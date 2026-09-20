'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
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
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1>Entrar</h1>
      <form className="card" onSubmit={handleSubmit}>
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
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="muted">
        Não tem conta? <Link href="/registro">Criar conta</Link>
      </p>
      <p className="muted">
        É síndico/gestor e vai cadastrar o condomínio pela primeira vez?{' '}
        <Link href="/cadastro-empresa">Cadastrar meu condomínio</Link>
      </p>
    </div>
  );
}
