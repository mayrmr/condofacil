'use client';

import { useEffect, useMemo, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCalendar, IconFilter, IconGrid, IconList, IconSearch, IconX } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { tempoRelativo } from '@/lib/formatacao';
import type { Bloco, Ocorrencia, PerfilFuncionarioOuGestor, Prioridade } from '@/lib/types';

const VISOES = [
  { chave: 'kanban', label: 'Kanban', icon: IconGrid },
  { chave: 'calendario', label: 'Calendário', icon: IconCalendar },
  { chave: 'lista', label: 'Lista', icon: IconList },
] as const;

type Visao = (typeof VISOES)[number]['chave'];
type ColunaKanbanDto = { chave: string; label: string; itens: Ocorrencia[] };
type ResultadoDashboard = Ocorrencia[] | Record<string, Ocorrencia[]> | ColunaKanbanDto[];

const CATEGORIAS = ['iluminacao', 'equipamento', 'vazamento', 'acessibilidade', 'seguranca', 'manutencao', 'outro'];
const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const PERIODOS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
  { label: 'Tudo', dias: undefined },
];

interface Filtros {
  categoria: string;
  blocoId: string;
  responsavelFuncionarioId: string;
  prioridade: string;
  periodoDias: number | undefined;
}

const FILTROS_PADRAO: Filtros = {
  categoria: '',
  blocoId: '',
  responsavelFuncionarioId: '',
  prioridade: '',
  periodoDias: 30,
};

function CartaoKanban({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  const urgente = ocorrencia.prioridade === 'URGENTE';
  return (
    <a href={`/ocorrencias/${ocorrencia.id}`} className="kanban-card">
      <span className={`categoria-badge${urgente ? ' urgente' : ''}`}>
        {urgente ? 'Urgente' : ocorrencia.categoria}
      </span>
      <strong>{ocorrencia.titulo}</strong>
      <span className="autor">
        {ocorrencia.usuario?.nomeCompleto}
        {ocorrencia.usuario && ocorrencia.localizacaoNome ? ' · ' : ''}
        {ocorrencia.localizacaoNome}
      </span>
      <span className="tempo">{tempoRelativo(ocorrencia.criadoEm)}</span>
    </a>
  );
}

function ColunaKanban({ titulo, itens, cor }: { titulo: string; itens: Ocorrencia[]; cor?: string }) {
  return (
    <div className="coluna">
      <div className="coluna-header">
        {cor && <span className="coluna-dot" style={{ background: cor }} />}
        <span className="coluna-titulo">{titulo}</span>
        <span className="coluna-count">{itens.length}</span>
      </div>
      {itens.map((o) => (
        <CartaoKanban key={o.id} ocorrencia={o} />
      ))}
    </div>
  );
}

const COR_BUCKET: Record<string, string> = {
  ABERTAS: 'var(--danger)',
  EM_ANDAMENTO: 'var(--warning)',
  CONCLUIDAS: 'var(--success)',
};

function FiltroSelect({
  valor,
  ativo,
  aoMudar,
  aoLimpar,
  children,
}: {
  valor: string;
  ativo: boolean;
  aoMudar: (v: string) => void;
  aoLimpar: () => void;
  children: React.ReactNode;
}) {
  return (
    <span className={`filtro-select-wrap${ativo ? ' ativo' : ''}`}>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {children}
      </select>
      {ativo && (
        <button type="button" className="filtro-limpar-um" onClick={aoLimpar} aria-label="Limpar filtro">
          <IconX />
        </button>
      )}
    </span>
  );
}

function ConteudoDashboard() {
  const { perfil } = useAuth();
  const predioId = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.[0]?.predio.id;

  const [visao, setVisao] = useState<Visao>('kanban');
  const [dados, setDados] = useState<ResultadoDashboard>([]);
  const [funcionarios, setFuncionarios] = useState<PerfilFuncionarioOuGestor[]>([]);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);

  useEffect(() => {
    if (perfil?.role === 'GESTOR') {
      api.get<PerfilFuncionarioOuGestor[]>('/gestor/funcionarios').then(setFuncionarios);
    }
  }, [perfil]);

  useEffect(() => {
    if (!predioId) return;
    api.get<Bloco[]>(`/predios/${predioId}/blocos`).then(setBlocos);
  }, [predioId]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const rota = perfil?.role === 'GESTOR' ? '/gestor/dashboard' : '/funcionario/dashboard';
    const params = new URLSearchParams({ view: visao });
    if (buscaAplicada) params.set('q', buscaAplicada);
    if (filtros.categoria) params.set('categoria', filtros.categoria);
    if (filtros.blocoId) params.set('blocoId', filtros.blocoId);
    if (filtros.responsavelFuncionarioId) params.set('responsavelFuncionarioId', filtros.responsavelFuncionarioId);
    if (filtros.prioridade) params.set('prioridade', filtros.prioridade);
    if (filtros.periodoDias) params.set('periodoDias', String(filtros.periodoDias));

    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao trocar de aba/visao/filtro, padrao de data fetching em effect
    setCarregando(true);
    api.get<ResultadoDashboard>(`${rota}?${params.toString()}`).then((r) => {
      // Evita que uma resposta antiga (de um filtro ja trocado) sobrescreva
      // uma mais recente que tenha chegado primeiro.
      if (cancelado) return;
      setDados(r);
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [visao, perfil, buscaAplicada, filtros]);

  const filtrosAtivos = useMemo(
    () =>
      Boolean(
        filtros.categoria ||
          filtros.blocoId ||
          filtros.responsavelFuncionarioId ||
          filtros.prioridade ||
          filtros.periodoDias !== FILTROS_PADRAO.periodoDias,
      ),
    [filtros],
  );

  function limparFiltro<K extends keyof Filtros>(chave: K) {
    setFiltros((atual) => ({ ...atual, [chave]: FILTROS_PADRAO[chave] }));
  }

  return (
    <div>
      <div className="row-between">
        <h1>Ocorrências</h1>
      </div>

      <div className="dashboard-toolbar">
        <label className="dashboard-busca">
          <IconSearch />
          <input
            placeholder="Buscar ocorrência..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <div className="tabs">
          {VISOES.map(({ chave, label, icon: Icon }) => (
            <button key={chave} className={chave === visao ? 'ativo' : ''} onClick={() => setVisao(chave)}>
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filtros-barra">
        <span className="filtros-label">
          <IconFilter />
          Filtros
        </span>

        <FiltroSelect
          valor={filtros.prioridade}
          ativo={filtros.prioridade !== ''}
          aoMudar={(v) => setFiltros((f) => ({ ...f, prioridade: v }))}
          aoLimpar={() => limparFiltro('prioridade')}
        >
          <option value="">Prioridade: todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              Prioridade: {p.toLowerCase()}
            </option>
          ))}
        </FiltroSelect>

        <FiltroSelect
          valor={filtros.categoria}
          ativo={filtros.categoria !== ''}
          aoMudar={(v) => setFiltros((f) => ({ ...f, categoria: v }))}
          aoLimpar={() => limparFiltro('categoria')}
        >
          <option value="">Categoria: todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              Categoria: {c}
            </option>
          ))}
        </FiltroSelect>

        <FiltroSelect
          valor={filtros.blocoId}
          ativo={filtros.blocoId !== ''}
          aoMudar={(v) => setFiltros((f) => ({ ...f, blocoId: v }))}
          aoLimpar={() => limparFiltro('blocoId')}
        >
          <option value="">Bloco: todos</option>
          {blocos.map((b) => (
            <option key={b.id} value={b.id}>
              Bloco: {b.nome}
            </option>
          ))}
        </FiltroSelect>

        {perfil?.role === 'GESTOR' && (
          <FiltroSelect
            valor={filtros.responsavelFuncionarioId}
            ativo={filtros.responsavelFuncionarioId !== ''}
            aoMudar={(v) => setFiltros((f) => ({ ...f, responsavelFuncionarioId: v }))}
            aoLimpar={() => limparFiltro('responsavelFuncionarioId')}
          >
            <option value="">Responsável: todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                Responsável: {f.nomeCompleto}
              </option>
            ))}
          </FiltroSelect>
        )}

        <FiltroSelect
          valor={filtros.periodoDias ? String(filtros.periodoDias) : ''}
          ativo={filtros.periodoDias !== FILTROS_PADRAO.periodoDias}
          aoMudar={(v) => setFiltros((f) => ({ ...f, periodoDias: v ? Number(v) : undefined }))}
          aoLimpar={() => limparFiltro('periodoDias')}
        >
          {PERIODOS.map((p) => (
            <option key={p.label} value={p.dias ?? ''}>
              Período: {p.label}
            </option>
          ))}
        </FiltroSelect>

        {filtrosAtivos && (
          <button type="button" className="filtros-limpar-todos" onClick={() => setFiltros(FILTROS_PADRAO)}>
            Limpar filtros
          </button>
        )}
      </div>

      {carregando && <p className="muted">Carregando...</p>}

      {!carregando && visao === 'lista' && (
        <div className="stack">
          {(dados as Ocorrencia[]).map((o) => (
            <OcorrenciaCard key={o.id} ocorrencia={o} />
          ))}
          {(dados as Ocorrencia[]).length === 0 && <p className="muted">Nenhuma ocorrência encontrada.</p>}
        </div>
      )}

      {!carregando && visao === 'kanban' && (
        <div className="kanban">
          {(dados as ColunaKanbanDto[]).map((coluna) => (
            <ColunaKanban
              key={coluna.chave}
              titulo={coluna.label}
              itens={coluna.itens}
              cor={COR_BUCKET[coluna.chave]}
            />
          ))}
        </div>
      )}

      {!carregando && visao === 'calendario' && (
        <div className="stack">
          {Object.entries(dados as Record<string, Ocorrencia[]>)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([data, itens]) => (
              <div key={data} className="card">
                <h3>{data}</h3>
                <div className="stack" style={{ marginTop: 8 }}>
                  {itens.map((o) => (
                    <a key={o.id} href={`/ocorrencias/${o.id}`}>
                      {o.titulo}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          {Object.keys(dados as Record<string, Ocorrencia[]>).length === 0 && (
            <p className="muted">Nenhuma ocorrência encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth papeis={['FUNCIONARIO', 'GESTOR']}>
      <ConteudoDashboard />
    </RequireAuth>
  );
}
