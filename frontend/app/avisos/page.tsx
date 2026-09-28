'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconAlertCircle, IconBell, IconSearch } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData } from '@/lib/formatacao';
import type { Aviso } from '@/lib/types';

const CATEGORIAS_URGENTES = ['assembleia', 'urgente', 'seguranca'];

function ehUrgente(categoria: string): boolean {
  return CATEGORIAS_URGENTES.some((c) => categoria.toLowerCase().includes(c));
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function grupoDoAviso(criadoEm: string): 'HOJE' | 'ESTA SEMANA' | 'ANTERIORES' {
  const data = new Date(criadoEm);
  const agora = new Date();
  const diffDias = (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
  if (data.toDateString() === agora.toDateString()) return 'HOJE';
  if (diffDias <= 7) return 'ESTA SEMANA';
  return 'ANTERIORES';
}

function LinhaAviso({
  aviso,
  aberto,
  aoAlternar,
  aoAtualizar,
}: {
  aviso: Aviso;
  aberto: boolean;
  aoAlternar: () => void;
  aoAtualizar: () => void;
}) {
  const { perfil } = useAuth();
  const [texto, setTexto] = useState('');
  const urgente = ehUrgente(aviso.categoria);

  async function comentar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    await api.post(`/avisos/${aviso.id}/comentarios`, { texto });
    setTexto('');
    aoAtualizar();
  }

  async function encerrar() {
    await api.patch(`/avisos/${aviso.id}`, { status: 'ENCERRADO' });
    aoAtualizar();
  }

  return (
    <div id={aviso.id} className="card">
      <button
        onClick={aoAlternar}
        className="row"
        style={{
          width: '100%',
          alignItems: 'flex-start',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <span className="chip" style={urgente ? { background: 'var(--accent-soft)', color: 'var(--warning)' } : undefined}>
          {urgente ? <IconAlertCircle style={{ width: 18, height: 18 }} /> : <IconBell style={{ width: 18, height: 18 }} />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="row-between">
            <strong style={{ fontSize: '0.92rem' }}>{aviso.titulo}</strong>
            <span className="muted">{formatarData(aviso.criadoEm)}</span>
          </div>
          {!aberto && (
            <p className="muted" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {aviso.descricao}
            </p>
          )}
          {aviso.status === 'ENCERRADO' && (
            <span className="badge" style={{ marginTop: 4 }}>
              Encerrado
            </span>
          )}
        </div>
      </button>

      {aberto && (
        <div style={{ marginTop: 12, paddingLeft: 52 }}>
          <p>{aviso.descricao}</p>

          {aviso.imagens && aviso.imagens.length > 0 && (
            <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              {aviso.imagens.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </div>
          )}

          <div className="chat" style={{ marginTop: 12 }}>
            {aviso.comentarios?.map((c) => (
              <div key={c.id} className={`chat-bubble ${c.autorId === perfil?.id ? 'mine' : ''}`}>
                <p>{c.texto}</p>
                <span className="muted">
                  {c.autorTipo} · {formatarData(c.criadoEm)}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={comentar} className="field" style={{ marginTop: 12 }}>
            <textarea placeholder="Comentar..." value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
              Comentar
            </button>
          </form>

          {perfil?.role === 'GESTOR' && aviso.status === 'ATIVO' && (
            <button className="btn-danger" onClick={encerrar} style={{ marginTop: 8 }}>
              Encerrar aviso
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ListaAvisos() {
  const { perfil } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  async function carregar() {
    const dados = await api.get<Aviso[]>('/avisos');
    setAvisos(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
  }, []);

  const termo = normalizar(busca);
  const avisosFiltrados = termo
    ? avisos.filter((a) => normalizar(a.titulo).includes(termo) || normalizar(a.descricao).includes(termo))
    : avisos;

  const grupos: Record<string, Aviso[]> = { HOJE: [], 'ESTA SEMANA': [], ANTERIORES: [] };
  for (const aviso of avisosFiltrados) {
    grupos[grupoDoAviso(aviso.criadoEm)].push(aviso);
  }

  return (
    <div className="stack">
      <PageTopBar title="Avisos">
        {perfil?.role === 'GESTOR' && (
          <Link href="/avisos/novo" className="btn btn-primary">
            + Novo aviso
          </Link>
        )}
      </PageTopBar>
      <div>
        <label className="dashboard-busca">
          <IconSearch />
          <input placeholder="Buscar aviso..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>
      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && avisos.length === 0 && <p className="muted">Nenhum aviso publicado ainda.</p>}
      {!carregando && avisos.length > 0 && avisosFiltrados.length === 0 && (
        <p className="muted">Nenhum aviso encontrado para essa busca.</p>
      )}
      {(['HOJE', 'ESTA SEMANA', 'ANTERIORES'] as const)
        .filter((g) => grupos[g].length > 0)
        .map((g) => (
          <div key={g} className="stack">
            <p className="muted" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.03em' }}>
              {g}
            </p>
            {grupos[g].map((a) => (
              <LinhaAviso
                key={a.id}
                aviso={a}
                aberto={abertoId === a.id}
                aoAlternar={() => setAbertoId((atual) => (atual === a.id ? null : a.id))}
                aoAtualizar={carregar}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

export default function AvisosPage() {
  return (
    <RequireAuth>
      <ListaAvisos />
    </RequireAuth>
  );
}
