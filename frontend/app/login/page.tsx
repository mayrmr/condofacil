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
    <div className="login-page page-transition">
      <div className="login-brand-panel">
        <div className="login-brand-decor d1" />
        <div className="login-brand-decor d2" />

        <div className="login-brand-header">CondoFácil</div>

        <div className="login-brand-copy">
          <p className="login-brand-headline">Seu condomínio, na palma da sua mão.</p>
          <p>
            Financeiro, reservas, avisos e ocorrências — acompanhe e resolva tudo sem precisar ir até
            a portaria.
          </p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- imagem estatica decorativa, sem beneficio do next/image aqui */}
        <img src="/images/login-predio.jpg" alt="" className="login-brand-image" />
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          <h1>Entrar na sua conta</h1>
          <p className="login-subtitle">Acesse com o e-mail cadastrado na sua unidade.</p>

          <form className="card login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="voce@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && <p className="erro">{erro}</p>}
            <button type="submit" className="btn-primary login-submit" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="login-footer-links">
            Não tem conta? <Link href="/registro">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
