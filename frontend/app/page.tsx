'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { formatarData } from '@/lib/formatacao';
import type { Aviso, Ocorrencia } from '@/lib/types';

type ItemFeed = ({ tipo: 'ocorrencia' } & Ocorrencia) | ({ tipo: 'aviso' } & Aviso);

function FeedConteudo() {
  const [itens, setItens] = useState<ItemFeed[]>([]);
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const [ocorrencias, avisos] = await Promise.all([
      api.get<Ocorrencia[]>(`/ocorrencias${query}`),
      api.get<Aviso[]>(`/avisos${query}`),
    ]);
    const combinado: ItemFeed[] = [
      ...ocorrencias.map((o) => ({ tipo: 'ocorrencia' as const, ...o })),
      ...avisos.map((a) => ({ tipo: 'aviso' as const, ...a })),
    ].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    setItens(combinado);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial/refetch ao mudar o filtro, padrao de data fetching em effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  return (
    <>
      <div className="row-between">
        <h1>Feed do condomínio</h1>
        <Link href="/ocorrencias/nova" className="btn btn-primary">
          + Nova ocorrência
        </Link>
      </div>
      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="categoria">Filtrar por categoria</label>
        <input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </div>
      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && itens.length === 0 && <p className="muted">Nenhuma ocorrência ou aviso por aqui ainda.</p>}
      <div className="stack">
        {itens.map((item) =>
          item.tipo === 'ocorrencia' ? (
            <OcorrenciaCard key={item.id} ocorrencia={item} />
          ) : (
            <Link key={item.id} href={`/avisos#${item.id}`} className="card">
              <div className="row-between">
                <strong>📢 {item.titulo}</strong>
                <span className="badge">Aviso</span>
              </div>
              <p className="muted" style={{ marginTop: 6 }}>
                {item.categoria} · {formatarData(item.criadoEm)}
              </p>
            </Link>
          ),
        )}
      </div>
    </>
  );
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <FeedConteudo />
    </RequireAuth>
  );
}
