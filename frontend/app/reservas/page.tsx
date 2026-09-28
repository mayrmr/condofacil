'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCalendar, IconPlus } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AreaSocial, Reserva } from '@/lib/types';

const GRADIENTES_AREA = [
  'linear-gradient(160deg, var(--primary), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--accent), var(--primary))',
  'linear-gradient(160deg, var(--primary-hover), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--warning), var(--primary-hover))',
];

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function mesAbreviado(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase();
}

function diaDoMes(iso: string): string {
  return String(new Date(iso).getDate()).padStart(2, '0');
}

function proximaReserva(reservas: Reserva[]): Reserva | null {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const futuras = reservas
    .filter((r) => r.status === 'CONFIRMADA' && new Date(r.data) >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio));
  return futuras[0] ?? null;
}

function NovaReservaForm({
  areas,
  areaId,
  setAreaId,
  aoCriar,
}: {
  areas: AreaSocial[];
  areaId: string;
  setAreaId: (id: string) => void;
  aoCriar: () => void;
}) {
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/reservas', { areaId, data, horaInicio, horaFim });
      setData('');
      setHoraInicio('');
      setHoraFim('');
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível reservar.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Fazer uma reserva</h2>
      <div className="field" style={{ marginTop: 8 }}>
        <label htmlFor="areaId">Área</label>
        <select id="areaId" required value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="">Selecione...</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id} disabled={!a.ativa}>
              {a.nome}
              {!a.ativa ? ' (indisponível)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="data">Data</label>
          <input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="horaInicio">Início</label>
          <input id="horaInicio" type="time" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="horaFim">Fim</label>
          <input id="horaFim" type="time" required value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
        </div>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Reservar
      </button>
    </form>
  );
}

function ConteudoReservas() {
  const { perfil } = useAuth();
  const [areas, setAreas] = useState<AreaSocial[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [areaId, setAreaId] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  async function carregar() {
    const [a, r] = await Promise.all([
      api.get<AreaSocial[]>('/reservas/areas'),
      api.get<Reserva[]>('/reservas'),
    ]);
    setAreas(a);
    setReservas(r);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();

  }, []);

  async function cancelar(id: string) {
    if (!confirm('Cancelar esta reserva?')) return;
    await api.delete(`/reservas/${id}`);
    await carregar();
  }

  function abrirFormParaArea(id: string) {
    setAreaId(id);
    setMostrarForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const destaque = useMemo(() => proximaReserva(reservas), [reservas]);
  const ehUsuario = perfil?.role === 'USUARIO';

  return (
    <div className="stack">
      <div className="row-between">
        <h1 style={{ marginBottom: 0 }}>Reservas</h1>
        {ehUsuario && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setMostrarForm((v) => !v);
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }}
          >
            <IconPlus width={16} height={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            Nova reserva
          </button>
        )}
      </div>

      {destaque && (
        <div className="reserva-destaque">
          <div className="reserva-destaque-data">
            <span>{mesAbreviado(destaque.data)}</span>
            <strong>{diaDoMes(destaque.data)}</strong>
          </div>
          <div className="reserva-destaque-info">
            <div className="reserva-destaque-titulo">
              {ehUsuario ? 'Sua próxima reserva' : 'Próxima reserva'} · {destaque.area?.nome}
            </div>
            <div className="reserva-destaque-sub">
              {formatarData(destaque.data)} · {destaque.horaInicio} às {destaque.horaFim}
            </div>
          </div>
          <span className="reserva-destaque-badge">CONFIRMADA</span>
        </div>
      )}

      <div>
        <h2>Áreas comuns</h2>
        <div className="areas-grid">
          {areas.map((a, i) => {
            const clicavel = ehUsuario && a.ativa;
            return (
              <div
                key={a.id}
                className={`area-card${a.ativa ? '' : ' area-card-indisponivel'}${clicavel ? ' area-card-clicavel' : ''}`}
                role={clicavel ? 'button' : undefined}
                tabIndex={clicavel ? 0 : undefined}
                onClick={clicavel ? () => abrirFormParaArea(a.id) : undefined}
                onKeyDown={
                  clicavel
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') abrirFormParaArea(a.id);
                      }
                    : undefined
                }
              >
                <div className="area-card-banner" style={{ background: GRADIENTES_AREA[i % GRADIENTES_AREA.length] }} />
                <div className="area-card-body">
                  <div className="area-card-nome">{a.nome}</div>
                  <div className="area-card-status">
                    {a.ativa ? a.descricao || 'Disponível para reserva' : 'Indisponível'}
                  </div>
                </div>
              </div>
            );
          })}
          {areas.length === 0 && <p className="muted">Nenhuma área cadastrada ainda.</p>}
        </div>
        {perfil?.role === 'GESTOR' && (
          <p className="muted" style={{ marginTop: 12 }}>
            Para cadastrar ou editar áreas, use a{' '}
            <Link href="/predio/estrutura" style={{ textDecoration: 'underline' }}>
              Estrutura do prédio
            </Link>
            .
          </p>
        )}
      </div>

      {ehUsuario && mostrarForm && (
        <div ref={formRef}>
          <NovaReservaForm
            areas={areas}
            areaId={areaId}
            setAreaId={setAreaId}
            aoCriar={() => {
              carregar();
              setMostrarForm(false);
              setAreaId('');
            }}
          />
        </div>
      )}

      <div className="card">
        <h2>{ehUsuario ? 'Minhas reservas' : 'Todas as reservas'}</h2>
        {carregando && <p className="muted">Carregando...</p>}
        <div className="stack" style={{ marginTop: 10 }}>
          {reservas.map((r) => (
            <div key={r.id} className="row-between">
              <div className="row" style={{ gap: 10 }}>
                <span className="reserva-item-icone">
                  <IconCalendar width={16} height={16} />
                </span>
                <div>
                  <strong>{r.area?.nome}</strong>
                  <p className="muted">
                    {formatarData(r.data)} · {r.horaInicio} às {r.horaFim}
                  </p>
                </div>
              </div>
              <div className="row">
                <span className={`badge ${r.status === 'CONFIRMADA' ? 'badge-RESOLVIDA' : 'badge-CANCELAMENTO'}`}>
                  {r.status === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'}
                </span>
                {r.status === 'CONFIRMADA' && (
                  <button className="btn-danger" onClick={() => cancelar(r.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!carregando && reservas.length === 0 && <p className="muted">Nenhuma reserva ainda.</p>}
        </div>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  return (
    <RequireAuth>
      <ConteudoReservas />
    </RequireAuth>
  );
}
