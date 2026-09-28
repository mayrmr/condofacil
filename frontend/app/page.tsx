'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { OcorrenciaModal } from '@/components/OcorrenciaModal';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconBell, IconCalendar, IconGrid, IconPackage, IconPlus } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatarData } from '@/lib/formatacao';
import type { Aviso, Ocorrencia, Reserva } from '@/lib/types';

const PERIODOS = [
  { valor: 'mes', texto: 'Mês' },
  { valor: 'trimestre', texto: 'Trimestre' },
  { valor: 'ano', texto: 'Ano' },
] as const;

type Periodo = (typeof PERIODOS)[number]['valor'];

function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] ?? '';
}

function chaveDaReserva(iso: string): string {
  return iso.slice(0, 10);
}

function formatarChave(chave: string): string {
  const [ano, mes, dia] = chave.split('-');
  return `${dia}/${mes}/${ano}`;
}

function InicioGestor() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [resumo, setResumo] = useState<{
    totalOcorrencias: number;
    ocorrenciasEmAndamento: number;
    totalUsuarios: number;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<typeof resumo>(`/gestor/resumo?periodo=${periodo}`)
      .then((dados) => {
        if (!cancelado) setResumo(dados);
      });
    return () => {
      cancelado = true;
    };
  }, [periodo]);

  return (
    <div className="stack">
      <PageTopBar title="Visão geral" sino>
        <div className="tabs">
          {PERIODOS.map((p) => (
            <button key={p.valor} className={p.valor === periodo ? 'ativo' : ''} onClick={() => setPeriodo(p.valor)}>
              {p.texto}
            </button>
          ))}
        </div>
      </PageTopBar>

      <div className="resumo-grid">
        <div className="resumo-card">
          <div className="resumo-card-numero">{resumo?.totalOcorrencias ?? '—'}</div>
          <div className="resumo-card-label">Ocorrências no período</div>
        </div>
        <div className="resumo-card">
          <div className="resumo-card-numero">{resumo?.ocorrenciasEmAndamento ?? '—'}</div>
          <div className="resumo-card-label">Ocorrências em andamento</div>
        </div>
        <div className="resumo-card">
          <div className="resumo-card-numero">{resumo?.totalUsuarios ?? '—'}</div>
          <div className="resumo-card-label">Usuários vinculados ao prédio</div>
        </div>
      </div>

      <h2>Ações rápidas</h2>
      <div className="atalhos-grid">
        <Link href="/reservas" className="atalho-card">
          <span className="chip">
            <IconCalendar />
          </span>
          Aprovar reservas
        </Link>
        <Link href="/avisos/novo" className="atalho-card">
          <span className="chip">
            <IconPlus />
          </span>
          Novo aviso
        </Link>
        <Link href="/dashboard" className="atalho-card">
          <span className="chip">
            <IconGrid />
          </span>
          Acompanhar ocorrências
        </Link>
      </div>
    </div>
  );
}

function InicioUsuario() {
  const { perfil } = useAuth();
  const [resumo, setResumo] = useState<{ encomendasPendentes: number; proximaReserva: Reserva | null } | null>(null);

  useEffect(() => {
    api.get<typeof resumo>('/usuarios/me/resumo').then(setResumo);
  }, []);

  return (
    <div className="stack">
      <PageTopBar
        title={`Olá, ${perfil ? primeiroNome(perfil.nomeCompleto) : ''}`}
        subtitulo="Bem-vindo de volta"
        sino
      />

      <div className="resumo-grid">
        <div className="resumo-card">
          <div className="resumo-card-numero">{resumo?.encomendasPendentes ?? '—'}</div>
          <div className="resumo-card-label">Encomendas para retirada</div>
        </div>
        <div className="resumo-card">
          <div className="resumo-card-numero" style={{ fontSize: '1.15rem' }}>
            {resumo?.proximaReserva
              ? `${formatarChave(chaveDaReserva(resumo.proximaReserva.data))} · ${resumo.proximaReserva.area?.nome}`
              : 'Nenhuma'}
          </div>
          <div className="resumo-card-label">Próxima reserva</div>
        </div>
      </div>

      <h2>Ações rápidas</h2>
      <div className="atalhos-grid">
        <Link href="/reservas" className="atalho-card">
          <span className="chip">
            <IconCalendar />
          </span>
          Reservar área
        </Link>
        <Link href="/avisos" className="atalho-card">
          <span className="chip">
            <IconBell />
          </span>
          Avisos
        </Link>
        <Link href="/minhas-ocorrencias" className="atalho-card">
          <span className="chip">
            <IconGrid />
          </span>
          Minhas ocorrências
        </Link>
      </div>
    </div>
  );
}

function AcessoRapidoFuncionario() {
  return (
    <div className="card">
      <h2>Acesso rápido</h2>
      <div className="row" style={{ marginTop: 12, gap: 12 }}>
        <Link href="/reservas" className="quick-tile">
          <span className="chip">
            <IconCalendar />
          </span>
          <span>Reservas</span>
        </Link>
        <Link href="/encomendas" className="quick-tile">
          <span className="chip">
            <IconPackage />
          </span>
          <span>Encomendas</span>
        </Link>
        <Link href="/dashboard" className="quick-tile">
          <span className="chip">
            <IconGrid />
          </span>
          <span>Ocorrências</span>
        </Link>
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

function InicioFuncionario() {
  const { perfil } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const dados = await api.get<Ocorrencia[]>('/ocorrencias');
    setOcorrencias(dados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
  }, [carregar]);

  return (
    <div className="stack">
      <PageTopBar title={`Olá, ${perfil ? primeiroNome(perfil.nomeCompleto) : ''}`} sino />
      <AcessoRapidoFuncionario />
      <AvisosRecentes />

      <div className="card">
        <h2>Ocorrências do condomínio</h2>
        {carregando && <p className="muted">Carregando...</p>}
        {!carregando && ocorrencias.length === 0 && <p className="muted">Nenhuma ocorrência por aqui ainda.</p>}
        <div className="stack" style={{ marginTop: 8 }}>
          {ocorrencias.map((o) => (
            <OcorrenciaCard key={o.id} ocorrencia={o} aoAbrir={setOcorrenciaAbertaId} />
          ))}
        </div>
      </div>

      {ocorrenciaAbertaId && (
        <OcorrenciaModal id={ocorrenciaAbertaId} aoFechar={() => setOcorrenciaAbertaId(null)} aoAlterar={carregar} />
      )}
    </div>
  );
}

function FeedConteudo() {
  const { perfil } = useAuth();

  if (perfil?.role === 'GESTOR') return <InicioGestor />;
  if (perfil?.role === 'USUARIO') return <InicioUsuario />;
  return <InicioFuncionario />;
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <FeedConteudo />
    </RequireAuth>
  );
}
