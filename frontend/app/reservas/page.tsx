'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AreaSocial, Reserva } from '@/lib/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function NovaReservaForm({ areas, aoCriar }: { areas: AreaSocial[]; aoCriar: () => void }) {
  const [areaId, setAreaId] = useState('');
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

  return (
    <div className="stack">
      <h1>Reservas</h1>

      <div className="card">
        <h2>Áreas comuns</h2>
        <div className="stack" style={{ marginTop: 10 }}>
          {areas.map((a) => (
            <div key={a.id} className="row-between">
              <div>
                <strong>{a.nome}</strong>
                {a.descricao && <p className="muted">{a.descricao}</p>}
              </div>
              {!a.ativa && <span className="badge badge-CANCELAMENTO">Indisponível</span>}
            </div>
          ))}
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

      {perfil?.role === 'USUARIO' && <NovaReservaForm areas={areas} aoCriar={carregar} />}

      <div className="card">
        <h2>{perfil?.role === 'USUARIO' ? 'Minhas reservas' : 'Todas as reservas'}</h2>
        {carregando && <p className="muted">Carregando...</p>}
        <div className="stack" style={{ marginTop: 10 }}>
          {reservas.map((r) => (
            <div key={r.id} className="row-between">
              <div>
                <strong>{r.area?.nome}</strong>
                <p className="muted">
                  {formatarData(r.data)} · {r.horaInicio} às {r.horaFim}
                </p>
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
