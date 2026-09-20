'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase-client';

function FormularioAceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const criado = await api.post<{ email: string }>(`/auth/convite/${token}/aceitar`, {
        nomeCompleto,
        senha,
        telefone: telefone || undefined,
      });

      const sessao = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email: criado.email,
        senha,
      });
      const { error } = await supabase.auth.setSession({
        access_token: sessao.accessToken,
        refresh_token: sessao.refreshToken,
      });
      if (error) throw error;
      router.push('/');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível aceitar o convite.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Aceitar convite</h1>
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
          <label htmlFor="senha">Escolha uma senha</label>
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
          <label htmlFor="telefone">Telefone (opcional)</label>
          <input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Criando conta...' : 'Aceitar e criar minha conta'}
        </button>
      </form>
    </div>
  );
}

export default function AceitarConvitePage() {
  return <FormularioAceitarConvite />;
}
