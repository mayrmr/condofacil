'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FiltroDropdown } from '@/components/FiltroDropdown';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconPlus } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AreaSocial, Reserva } from '@/lib/types';

const GRADIENTES_AREA = [
  'linear-gradient(160deg, var(--primary), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--accent), var(--primary))',
  'linear-gradient(160deg, var(--primary-hover), var(--sidebar-bg))',
  'linear-gradient(160deg, var(--warning), var(--primary-hover))',
];

const LABEL_STATUS_RESERVA: Record<Reserva['status'], string> = {
  PENDENTE: 'Aguardando aprovação',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const BADGE_STATUS_RESERVA: Record<Reserva['status'], string> = {
  PENDENTE: 'badge-ANALISE',
  CONFIRMADA: 'badge-RESOLVIDA',
  CANCELADA: 'badge-CANCELAMENTO',
};

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// `Reserva.data` e um campo so-de-data (sem hora relevante), serializado
// pela API como meia-noite UTC. Nunca construir `new Date(reserva.data)`
// pra formatar/comparar — em fusos atras de UTC (ex. Brasil, -03) isso
// devolve o dia anterior. Em vez disso extraimos a chave "AAAA-MM-DD" direto
// da string e trabalhamos só com ela (comparação lexicográfica já ordena
// certo).
function chaveDaReserva(iso: string): string {
  return iso.slice(0, 10);
}

function formatarChave(chave: string): string {
  const [ano, mes, dia] = chave.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mesAbreviadoChave(chave: string): string {
  return MESES_ABREV[Number(chave.split('-')[1]) - 1];
}

function diaDoMesChave(chave: string): string {
  return chave.split('-')[2];
}

// Para Date locais de verdade (celulas do calendario, "hoje") — aqui os
// getters locais estao corretos, sem nenhum dado vindo do servidor envolvido.
function chaveDiaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function proximaReserva(reservas: Reserva[]): Reserva | null {
  const hojeChave = chaveDiaLocal(new Date());
  const futuras = reservas
    .filter((r) => r.status !== 'CANCELADA' && chaveDaReserva(r.data) >= hojeChave)
    .sort((a, b) => chaveDaReserva(a.data).localeCompare(chaveDaReserva(b.data)) || a.horaInicio.localeCompare(b.horaInicio));
  return futuras[0] ?? null;
}

function NovaReservaForm({
  areas,
  areaId,
  setAreaId,
  data,
  setData,
  aoCriar,
}: {
  areas: AreaSocial[];
  areaId: string;
  setAreaId: (id: string) => void;
  data: string;
  setData: (data: string) => void;
  aoCriar: () => void;
}) {
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
      <p className="muted" style={{ marginTop: 4 }}>
        Sua solicitação fica pendente até o gestor aprovar.
      </p>
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
        Solicitar reserva
      </button>
    </form>
  );
}

function CalendarioReservas({
  areas,
  reservas,
  podeReservar,
  aoEscolherData,
}: {
  areas: AreaSocial[];
  reservas: Reserva[];
  podeReservar: boolean;
  aoEscolherData: (areaId: string, data: string) => void;
}) {
  const [areaIdEscolhida, setAreaIdEscolhida] = useState('');
  const [mesRef, setMesRef] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const areaId = areaIdEscolhida || areas[0]?.id || '';

  const mesRefChave = `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, '0')}`;

  const reservasPorDia = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    for (const r of reservas) {
      if (r.areaId !== areaId || r.status === 'CANCELADA') continue;
      const chave = chaveDaReserva(r.data);
      if (!chave.startsWith(mesRefChave)) continue;
      const lista = mapa.get(chave);
      if (lista) lista.push(r);
      else mapa.set(chave, [r]);
    }
    return mapa;
  }, [reservas, areaId, mesRefChave]);

  const celulas = useMemo(() => {
    const primeiroDia = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
    const ultimoDia = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0);
    const antes = primeiroDia.getDay();
    const dias: (Date | null)[] = Array.from({ length: antes }, () => null);
    for (let n = 1; n <= ultimoDia.getDate(); n++) {
      dias.push(new Date(mesRef.getFullYear(), mesRef.getMonth(), n));
    }
    return dias;
  }, [mesRef]);

  const hojeChave = chaveDiaLocal(new Date());
  const reservasDoDiaSelecionado = diaSelecionado ? (reservasPorDia.get(diaSelecionado) ?? []) : [];

  function mudarMes(delta: number) {
    setDiaSelecionado(null);
    setMesRef((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  const areaSelecionada = areas.find((a) => a.id === areaId);

  return (
    <div className="card">
      <h2>Calendário de reservas</h2>
      <div className="calendario-split">
        <div className="calendario-coluna-calendario">
          <div className="calendario-topo">
            <FiltroDropdown
              label="Área"
              valorSelecionado={areaId}
              ativo={false}
              opcoes={areas.map((a) => ({ valor: a.id, texto: a.nome }))}
              aoSelecionar={(v) => {
                setAreaIdEscolhida(v);
                setDiaSelecionado(null);
              }}
            />
            <div className="calendario-nav">
              <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
                <IconChevronLeft width={14} height={14} />
              </button>
              <strong>{mesRef.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</strong>
              <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">
                <IconChevronRight width={14} height={14} />
              </button>
            </div>
          </div>

          <div className="calendario-grade">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="calendario-dia-semana">{d}</div>
            ))}
            {celulas.map((data, i) => {
              if (!data) return <div key={`vazio-${i}`} className="calendario-dia calendario-dia-vazio" />;
              const chave = chaveDiaLocal(data);
              const reservasDoDia = reservasPorDia.get(chave) ?? [];
              const ocupado = reservasDoDia.length > 0;
              const pendente = reservasDoDia.some((r) => r.status === 'PENDENTE');
              const passou = chave < hojeChave;
              const clicavel = ocupado || (podeReservar && !passou);
              return (
                <button
                  key={chave}
                  type="button"
                  className={`calendario-dia${ocupado ? (pendente ? ' calendario-dia-pendente' : ' calendario-dia-ocupado') : ' calendario-dia-livre'}${chave === hojeChave ? ' calendario-dia-hoje' : ''}${chave === diaSelecionado ? ' calendario-dia-selecionado' : ''}${passou && !ocupado ? ' calendario-dia-passado' : ''}`}
                  disabled={!clicavel}
                  onClick={() => {
                    if (ocupado) {
                      setDiaSelecionado((atual) => (atual === chave ? null : chave));
                    } else if (podeReservar) {
                      aoEscolherData(areaId, chave);
                    }
                  }}
                >
                  {data.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="calendario-coluna-detalhe">
          <strong>{areaSelecionada?.nome}</strong>
          <div className="calendario-legenda">
            <span><i className="calendario-legenda-dot calendario-dia-livre" /> Livre</span>
            <span><i className="calendario-legenda-dot calendario-dia-pendente" /> Pendente</span>
            <span><i className="calendario-legenda-dot calendario-dia-ocupado" /> Confirmado</span>
          </div>

          {diaSelecionado && reservasDoDiaSelecionado.length > 0 ? (
            <div className="calendario-detalhe-dia">
              <strong>{formatarChave(diaSelecionado)}</strong>
              <div className="stack" style={{ marginTop: 8 }}>
                {reservasDoDiaSelecionado.map((r) => (
                  <div key={r.id} className="row-between">
                    <span>{r.horaInicio} às {r.horaFim}</span>
                    <span className={`badge ${BADGE_STATUS_RESERVA[r.status]}`}>{LABEL_STATUS_RESERVA[r.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 14 }}>
              {podeReservar
                ? 'Clique num dia livre para reservar, ou num dia ocupado para ver os horários.'
                : 'Clique num dia ocupado para ver os horários reservados.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConteudoReservas() {
  const { perfil } = useAuth();
  const [areas, setAreas] = useState<AreaSocial[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [areaId, setAreaId] = useState('');
  const [dataForm, setDataForm] = useState('');
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

  async function aprovar(id: string) {
    await api.patch(`/reservas/${id}/aprovar`);
    await carregar();
  }

  async function recusar(id: string) {
    if (!confirm('Recusar esta solicitação de reserva?')) return;
    await api.patch(`/reservas/${id}/recusar`);
    await carregar();
  }

  function abrirFormParaArea(id: string, dataPreenchida?: string) {
    setAreaId(id);
    setDataForm(dataPreenchida ?? '');
    setMostrarForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const destaque = useMemo(() => proximaReserva(reservas), [reservas]);
  const ehUsuario = perfil?.role === 'USUARIO';
  const ehGestor = perfil?.role === 'GESTOR';
  const pendentes = useMemo(() => reservas.filter((r) => r.status === 'PENDENTE'), [reservas]);
  const listaPrincipal = ehGestor ? reservas.filter((r) => r.status !== 'PENDENTE') : reservas;

  return (
    <div className="stack">
      <PageTopBar title="Reservas">
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
      </PageTopBar>

      {destaque && (
        <div className="reserva-destaque">
          <div className="reserva-destaque-data">
            <span>{mesAbreviadoChave(chaveDaReserva(destaque.data))}</span>
            <strong>{diaDoMesChave(chaveDaReserva(destaque.data))}</strong>
          </div>
          <div className="reserva-destaque-info">
            <div className="reserva-destaque-titulo">
              {ehUsuario ? 'Sua próxima reserva' : 'Próxima reserva'} · {destaque.area?.nome}
            </div>
            <div className="reserva-destaque-sub">
              {formatarChave(chaveDaReserva(destaque.data))} · {destaque.horaInicio} às {destaque.horaFim}
            </div>
          </div>
          <span className="reserva-destaque-badge">{LABEL_STATUS_RESERVA[destaque.status]}</span>
        </div>
      )}

      {ehGestor && pendentes.length > 0 && (
        <div className="card">
          <h2>Solicitações pendentes</h2>
          <div className="stack" style={{ marginTop: 10 }}>
            {pendentes.map((r) => (
              <div key={r.id} className="row-between">
                <div>
                  <strong>{r.area?.nome}</strong>
                  <p className="muted">
                    {formatarChave(chaveDaReserva(r.data))} · {r.horaInicio} às {r.horaFim}
                  </p>
                </div>
                <div className="row">
                  <button className="btn-primary" onClick={() => aprovar(r.id)}>
                    Aprovar
                  </button>
                  <button className="btn-danger" onClick={() => recusar(r.id)}>
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                <div
                  className="area-card-banner"
                  style={{
                    background: a.fotoUrl
                      ? `url(${a.fotoUrl}) center/cover`
                      : GRADIENTES_AREA[i % GRADIENTES_AREA.length],
                  }}
                />
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
            data={dataForm}
            setData={setDataForm}
            aoCriar={() => {
              carregar();
              setMostrarForm(false);
              setAreaId('');
              setDataForm('');
            }}
          />
        </div>
      )}

      {areas.length > 0 && (
        <CalendarioReservas
          areas={areas}
          reservas={reservas}
          podeReservar={ehUsuario}
          aoEscolherData={(id, data) => abrirFormParaArea(id, data)}
        />
      )}

      <div className="card">
        <h2>{ehUsuario ? 'Minhas reservas' : 'Todas as reservas'}</h2>
        {carregando && <p className="muted">Carregando...</p>}
        <div className="stack" style={{ marginTop: 10 }}>
          {listaPrincipal.map((r) => (
            <div key={r.id} className="row-between">
              <div className="row" style={{ gap: 10 }}>
                <span className="reserva-item-icone">
                  <IconCalendar width={16} height={16} />
                </span>
                <div>
                  <strong>{r.area?.nome}</strong>
                  <p className="muted">
                    {formatarChave(chaveDaReserva(r.data))} · {r.horaInicio} às {r.horaFim}
                  </p>
                </div>
              </div>
              <div className="row">
                <span className={`badge ${BADGE_STATUS_RESERVA[r.status]}`}>{LABEL_STATUS_RESERVA[r.status]}</span>
                {r.status !== 'CANCELADA' && (
                  <button className="btn-danger" onClick={() => cancelar(r.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!carregando && listaPrincipal.length === 0 && <p className="muted">Nenhuma reserva ainda.</p>}
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
