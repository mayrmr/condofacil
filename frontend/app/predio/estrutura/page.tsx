'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AreaSocial, Bloco, PerfilFuncionarioOuGestor } from '@/lib/types';

function GerenciarEstrutura() {
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.[0]?.predio.id;

  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [areasSociais, setAreasSociais] = useState<AreaSocial[]>([]);
  const [nomeBloco, setNomeBloco] = useState('');
  const [nomeArea, setNomeArea] = useState('');
  const [numeroApartamento, setNumeroApartamento] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    if (!predioId) return;
    const [b, a] = await Promise.all([
      api.get<Bloco[]>(`/predios/${predioId}/blocos`),
      api.get<AreaSocial[]>(`/predios/${predioId}/areas-sociais`),
    ]);
    setBlocos(b);
    setAreasSociais(a);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar/trocar de predio, padrao de data fetching em effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predioId]);

  async function handleCriarBloco(e: FormEvent) {
    e.preventDefault();
    if (!predioId || !nomeBloco.trim()) return;
    try {
      await api.post(`/predios/${predioId}/blocos`, { nome: nomeBloco });
      setNomeBloco('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o bloco.');
    }
  }

  async function handleCriarArea(e: FormEvent) {
    e.preventDefault();
    if (!predioId || !nomeArea.trim()) return;
    try {
      await api.post(`/predios/${predioId}/areas-sociais`, { nome: nomeArea });
      setNomeArea('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a área social.');
    }
  }

  async function handleCriarApartamento(blocoId: string, e: FormEvent) {
    e.preventDefault();
    const numero = numeroApartamento[blocoId]?.trim();
    if (!predioId || !numero) return;
    try {
      await api.post(`/predios/${predioId}/blocos/${blocoId}/apartamentos`, { numero });
      setNumeroApartamento((prev) => ({ ...prev, [blocoId]: '' }));
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o apartamento.');
    }
  }

  if (!predioId) return <p className="muted">Carregando...</p>;

  return (
    <div className="stack">
      <h1>Estrutura do prédio</h1>
      <p className="muted">
        Cadastre os blocos, apartamentos e áreas sociais para que os moradores possam escolher a localização
        ao abrir uma ocorrência.
      </p>
      {erro && <p className="erro">{erro}</p>}

      <div className="card">
        <h2>Áreas sociais</h2>
        <div className="stack" style={{ marginTop: 8 }}>
          {areasSociais.map((a) => (
            <div key={a.id}>{a.nome}</div>
          ))}
          {areasSociais.length === 0 && <p className="muted">Nenhuma área social cadastrada.</p>}
        </div>
        <form onSubmit={handleCriarArea} className="row" style={{ marginTop: 12 }}>
          <input
            placeholder="Ex: Salão de festas"
            value={nomeArea}
            onChange={(e) => setNomeArea(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">
            Adicionar
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Blocos e apartamentos</h2>
        <div className="stack" style={{ marginTop: 8 }}>
          {blocos.map((b) => (
            <div key={b.id} className="card">
              <strong>{b.nome}</strong>
              <div className="stack" style={{ marginTop: 8 }}>
                {b.apartamentos.map((ap) => (
                  <span key={ap.id} className="muted">
                    Apto {ap.numero}
                  </span>
                ))}
                {b.apartamentos.length === 0 && <span className="muted">Nenhum apartamento ainda.</span>}
              </div>
              <form
                onSubmit={(e) => handleCriarApartamento(b.id, e)}
                className="row"
                style={{ marginTop: 12 }}
              >
                <input
                  placeholder="Número do apartamento"
                  value={numeroApartamento[b.id] ?? ''}
                  onChange={(e) => setNumeroApartamento((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button type="submit">Adicionar</button>
              </form>
            </div>
          ))}
          {blocos.length === 0 && <p className="muted">Nenhum bloco cadastrado.</p>}
        </div>
        <form onSubmit={handleCriarBloco} className="row" style={{ marginTop: 12 }}>
          <input
            placeholder="Ex: Bloco A"
            value={nomeBloco}
            onChange={(e) => setNomeBloco(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">
            Adicionar bloco
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EstruturaPredioPage() {
  return (
    <RequireAuth papeis={['GESTOR']}>
      <GerenciarEstrutura />
    </RequireAuth>
  );
}
