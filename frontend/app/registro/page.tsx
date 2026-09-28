'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase-client';
import type { TipoVinculo } from '@/lib/types';

interface ApartamentoPublico {
  id: string;
  numero: string;
}

interface BlocoPublico {
  id: string;
  nome: string;
  apartamentos: ApartamentoPublico[];
}

function FormularioRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [predioId, setPredioId] = useState(searchParams.get('predioId') ?? '');
  const [blocos, setBlocos] = useState<BlocoPublico[]>([]);
  const [blocoId, setBlocoId] = useState('');
  const [apartamentoId, setApartamentoId] = useState('');
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>('PROPRIETARIO');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nomePredio = searchParams.get('nomePredio');
  const predioPreenchido = Boolean(nomePredio && predioId);

  useEffect(() => {
    if (!predioId) return;
    let cancelado = false;
    api
      .get<BlocoPublico[]>(`/predios/${predioId}/estrutura-publica`)
      .then((dados) => {
        if (!cancelado) setBlocos(dados);
      })
      .catch(() => {
        if (!cancelado) setBlocos([]);
      });
    return () => {
      cancelado = true;
    };
  }, [predioId]);

  const blocosVisiveis = predioId ? blocos : [];
  const blocoSelecionado = blocosVisiveis.find((b) => b.id === blocoId);

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
        apartamentoId,
        tipoVinculo,
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
      {predioPreenchido ? (
        <p className="muted" style={{ marginBottom: 14 }}>
          Você está se cadastrando em: <strong>{nomePredio}</strong>
        </p>
      ) : (
        <div className="field">
          <label htmlFor="predioId">ID do prédio</label>
          <input
            id="predioId"
            required
            value={predioId}
            onChange={(e) => {
              setPredioId(e.target.value);
              setBlocoId('');
              setApartamentoId('');
            }}
            placeholder="Informado pelo síndico/gestor do seu condomínio"
          />
        </div>
      )}
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="blocoId">Bloco</label>
          <select
            id="blocoId"
            required
            value={blocoId}
            onChange={(e) => {
              setBlocoId(e.target.value);
              setApartamentoId('');
            }}
            disabled={blocosVisiveis.length === 0}
          >
            <option value="">{blocosVisiveis.length === 0 ? 'Informe o prédio primeiro' : 'Selecione...'}</option>
            {blocosVisiveis.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="apartamentoId">Apartamento</label>
          <select
            id="apartamentoId"
            required
            value={apartamentoId}
            onChange={(e) => setApartamentoId(e.target.value)}
            disabled={!blocoSelecionado}
          >
            <option value="">Selecione...</option>
            {blocoSelecionado?.apartamentos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.numero}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="tipoVinculo">Você é</label>
        <select id="tipoVinculo" value={tipoVinculo} onChange={(e) => setTipoVinculo(e.target.value as TipoVinculo)}>
          <option value="PROPRIETARIO">Proprietário</option>
          <option value="INQUILINO">Inquilino</option>
        </select>
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
    <div className="stack page-transition" style={{ maxWidth: 400, margin: '40px auto' }}>
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
