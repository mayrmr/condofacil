'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase-client';

// Cadastro inicial da empresa (secao 3 da especificacao): cria a Empresa, o
// primeiro Predio e o Gestor responsavel, tudo de uma vez, antes de existir
// qualquer sessao autenticada. Predios adicionais e convites de
// funcionario/gestor usam o fluxo normal depois do gestor logar.
function FormularioCadastroEmpresa() {
  const router = useRouter();

  const [empresaNome, setEmpresaNome] = useState('');
  const [predioNome, setPredioNome] = useState('');
  const [predioEndereco, setPredioEndereco] = useState('');
  const [gestorNomeCompleto, setGestorNomeCompleto] = useState('');
  const [gestorEmail, setGestorEmail] = useState('');
  const [gestorSenha, setGestorSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ predioId: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const criado = await api.post<{ predioId: string }>('/auth/cadastro-empresa', {
        empresaNome,
        predioNome,
        predioEndereco,
        gestorNomeCompleto,
        gestorEmail,
        gestorSenha,
      });

      const sessao = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email: gestorEmail,
        senha: gestorSenha,
      });
      const { error } = await supabase.auth.setSession({
        access_token: sessao.accessToken,
        refresh_token: sessao.refreshToken,
      });
      if (error) throw error;

      setResultado(criado);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a empresa.');
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div className="card stack">
        <h2>Empresa criada com sucesso!</h2>
        <p>Você já está logado como gestor. Guarde o ID do prédio para convidar moradores:</p>
        <p>
          <strong>ID do prédio:</strong> <code>{resultado.predioId}</code>
        </p>
        <p className="muted">
          Compartilhe com os moradores um link de cadastro como:
          <br />
          <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/registro?predioId=${resultado.predioId}`}</code>
        </p>
        <button className="btn-primary" onClick={() => router.push('/')}>
          Ir para o feed
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="empresaNome">Nome da empresa/condomínio</label>
        <input id="empresaNome" required value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="predioNome">Nome do prédio</label>
        <input id="predioNome" required value={predioNome} onChange={(e) => setPredioNome(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="predioEndereco">Endereço do prédio</label>
        <input
          id="predioEndereco"
          required
          value={predioEndereco}
          onChange={(e) => setPredioEndereco(e.target.value)}
        />
      </div>
      <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid var(--border)' }} />
      <div className="field">
        <label htmlFor="gestorNomeCompleto">Seu nome completo (gestor)</label>
        <input
          id="gestorNomeCompleto"
          required
          value={gestorNomeCompleto}
          onChange={(e) => setGestorNomeCompleto(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="gestorEmail">Seu e-mail</label>
        <input
          id="gestorEmail"
          type="email"
          required
          value={gestorEmail}
          onChange={(e) => setGestorEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="gestorSenha">Senha</label>
        <input
          id="gestorSenha"
          type="password"
          required
          minLength={8}
          value={gestorSenha}
          onChange={(e) => setGestorSenha(e.target.value)}
        />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%' }}>
        {enviando ? 'Criando...' : 'Criar empresa e conta de gestor'}
      </button>
    </form>
  );
}

export default function CadastroEmpresaPage() {
  return (
    <div className="stack" style={{ maxWidth: 440, margin: '40px auto' }}>
      <h1>Cadastrar meu condomínio</h1>
      <p className="muted">
        Use esta tela se você é o síndico/gestor e está trazendo o seu condomínio para a plataforma pela
        primeira vez.
      </p>
      <FormularioCadastroEmpresa />
      <p className="muted">
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}
