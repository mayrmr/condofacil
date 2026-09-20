'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Enquete } from '@/lib/types';

function ConteudoDetalheEnquete() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();
  const [enquete, setEnquete] = useState<Enquete | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.get<Enquete>(`/enquetes/${id}`);
      setEnquete(dados);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a enquete.');
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial/refetch ao trocar de enquete, padrao de data fetching em effect
    carregar();
  }, [carregar]);

  async function votar(opcaoId: string) {
    await api.post(`/enquetes/${id}/votar`, { opcaoId });
    await carregar();
  }

  async function encerrar() {
    await api.patch(`/enquetes/${id}/encerrar`);
    await carregar();
  }

  if (erro) return <p className="erro">{erro}</p>;
  if (!enquete) return <p className="muted">Carregando...</p>;

  const totalVotos = enquete.opcoes.reduce((soma, o) => soma + (o._count?.votos ?? 0), 0);

  return (
    <div className="stack">
      <div className="row-between">
        <h1>{enquete.titulo}</h1>
        <span className={`badge ${enquete.status === 'ATIVA' ? 'badge-ATENDIMENTO' : 'badge-CANCELAMENTO'}`}>
          {enquete.status === 'ATIVA' ? 'Ativa' : 'Encerrada'}
        </span>
      </div>

      <div className="card">
        {enquete.descricao && <p style={{ marginBottom: 12 }}>{enquete.descricao}</p>}
        <div className="stack">
          {enquete.opcoes.map((o) => {
            const votos = o._count?.votos ?? 0;
            const pct = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
            const selecionada = enquete.minhaOpcaoId === o.id;
            return (
              <button
                key={o.id}
                onClick={() => votar(o.id)}
                disabled={enquete.status === 'ENCERRADA'}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: selecionada ? 'var(--primary)' : undefined,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${pct}%`,
                    background: 'var(--chip-bg)',
                    zIndex: 0,
                    transition: 'width 0.3s ease',
                  }}
                />
                <div className="row-between" style={{ position: 'relative', zIndex: 1 }}>
                  <span>
                    {selecionada ? '✓ ' : ''}
                    {o.texto}
                  </span>
                  <span className="muted">
                    {votos} · {pct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          {totalVotos} {totalVotos === 1 ? 'voto no total' : 'votos no total'}
        </p>
      </div>

      {perfil?.role === 'GESTOR' && enquete.status === 'ATIVA' && (
        <button className="btn-danger" onClick={encerrar}>
          Encerrar enquete
        </button>
      )}
    </div>
  );
}

export default function DetalheEnquetePage() {
  return (
    <RequireAuth>
      <ConteudoDetalheEnquete />
    </RequireAuth>
  );
}
