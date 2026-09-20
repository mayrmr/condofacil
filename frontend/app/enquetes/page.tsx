'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Enquete } from '@/lib/types';

function NovaEnqueteForm({ aoCriar }: { aoCriar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [opcoes, setOpcoes] = useState(['', '']);
  const [erro, setErro] = useState<string | null>(null);

  function atualizarOpcao(i: number, valor: string) {
    setOpcoes((prev) => prev.map((o, idx) => (idx === i ? valor : o)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    const opcoesValidas = opcoes.map((o) => o.trim()).filter(Boolean);
    if (opcoesValidas.length < 2) {
      setErro('Informe ao menos duas opções.');
      return;
    }
    try {
      await api.post('/enquetes', { titulo, descricao: descricao || undefined, opcoes: opcoesValidas });
      setTitulo('');
      setDescricao('');
      setOpcoes(['', '']);
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a enquete.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Nova enquete</h2>
      <div className="field" style={{ marginTop: 8 }}>
        <label htmlFor="titulo">Título</label>
        <input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="descricao">Descrição (opcional)</label>
        <input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="field">
        <label>Opções</label>
        <div className="stack">
          {opcoes.map((o, i) => (
            <input
              key={i}
              placeholder={`Opção ${i + 1}`}
              value={o}
              onChange={(e) => atualizarOpcao(i, e.target.value)}
            />
          ))}
        </div>
        <button type="button" style={{ marginTop: 8 }} onClick={() => setOpcoes((prev) => [...prev, ''])}>
          + Adicionar opção
        </button>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Publicar enquete
      </button>
    </form>
  );
}

function ConteudoEnquetes() {
  const { perfil } = useAuth();
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const dados = await api.get<Enquete[]>('/enquetes');
    setEnquetes(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
     
  }, []);

  return (
    <div className="stack">
      <h1>Enquetes</h1>
      {perfil?.role === 'GESTOR' && <NovaEnqueteForm aoCriar={carregar} />}

      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && enquetes.length === 0 && <p className="muted">Nenhuma enquete por aqui ainda.</p>}
      <div className="stack">
        {enquetes.map((e) => {
          const totalVotos = e.opcoes.reduce((soma, o) => soma + (o._count?.votos ?? 0), 0);
          return (
            <Link key={e.id} href={`/enquetes/${e.id}`} className="card">
              <div className="row-between">
                <strong>{e.titulo}</strong>
                <span className={`badge ${e.status === 'ATIVA' ? 'badge-ATENDIMENTO' : 'badge-CANCELAMENTO'}`}>
                  {e.status === 'ATIVA' ? 'Ativa' : 'Encerrada'}
                </span>
              </div>
              <p className="muted" style={{ marginTop: 6 }}>
                {totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}
                {e.minhaOpcaoId ? ' · você já votou' : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function EnquetesPage() {
  return (
    <RequireAuth>
      <ConteudoEnquetes />
    </RequireAuth>
  );
}
