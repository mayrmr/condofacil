'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { IconBell, IconCalendar, IconPackage, IconPlus } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData } from '@/lib/formatacao';
import type { Aviso, Ocorrencia } from '@/lib/types';

function AcessoRapido() {
  const { perfil } = useAuth();
  const itens = [
    { href: '/reservas', label: 'Reservar área', icon: IconCalendar },
    ...(perfil?.role === 'USUARIO'
      ? [{ href: '/ocorrencias/nova', label: 'Abrir ocorrência', icon: IconPlus }]
      : []),
    { href: '/encomendas', label: 'Encomendas', icon: IconPackage },
  ];

  return (
    <div className="card">
      <h2>Acesso rápido</h2>
      <div className="row" style={{ marginTop: 12, gap: 12 }}>
        {itens.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="quick-tile">
              <span className="chip">
                <Icon />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AvisosRecentes() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
     
    api.get<Aviso[]>('/avisos').then((dados) => setAvisos(dados.slice(0, 3)));
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div className="card">
      <div className="row-between">
        <h2>Avisos recentes</h2>
        <Link href="/avisos" className="muted">
          Ver todos
        </Link>
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {avisos.map((a) => (
          <div key={a.id} className="row" style={{ alignItems: 'flex-start' }}>
            <span className="chip">
              <IconBell style={{ width: 18, height: 18 }} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.9rem' }}>{a.titulo}</strong>
                <span className="muted">{formatarData(a.criadoEm)}</span>
              </div>
              <p className="muted" style={{ marginTop: 2 }}>
                {a.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedConteudo() {
  const { perfil } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const dados = await api.get<Ocorrencia[]>(`/ocorrencias${query}`);
    setOcorrencias(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial/refetch ao mudar o filtro, padrao de data fetching em effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  return (
    <div className="stack">
      <div className="row-between">
        <h1>Início</h1>
        {perfil?.role === 'USUARIO' && (
          <Link href="/ocorrencias/nova" className="btn btn-primary">
            + Nova ocorrência
          </Link>
        )}
      </div>

      <AcessoRapido />
      <AvisosRecentes />

      <div className="card">
        <div className="row-between">
          <h2>Ocorrências do condomínio</h2>
        </div>
        <div className="field" style={{ maxWidth: 240, marginTop: 12 }}>
          <label htmlFor="categoria">Filtrar por categoria</label>
          <input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </div>
        {carregando && <p className="muted">Carregando...</p>}
        {!carregando && ocorrencias.length === 0 && <p className="muted">Nenhuma ocorrência por aqui ainda.</p>}
        <div className="stack" style={{ marginTop: 8 }}>
          {ocorrencias.map((o) => (
            <OcorrenciaCard key={o.id} ocorrencia={o} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <FeedConteudo />
    </RequireAuth>
  );
}
