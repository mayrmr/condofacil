'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiltroDropdown } from '@/components/FiltroDropdown';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { OcorrenciaModal } from '@/components/OcorrenciaModal';
import { RequireAuth } from '@/components/RequireAuth';
import { IconCalendar, IconFilter, IconGrid, IconList, IconSearch } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { COR_STATUS, LABEL_CATEGORIA, LABEL_STATUS, tempoRelativo } from '@/lib/formatacao';
import { transicoesPermitidas } from '@/lib/state-machine';
import type { Bloco, Ocorrencia, PerfilFuncionarioOuGestor, Prioridade, StatusOcorrencia } from '@/lib/types';

const VISOES = [
  { chave: 'kanban', label: 'Kanban', icon: IconGrid },
  { chave: 'calendario', label: 'Calendário', icon: IconCalendar },
  { chave: 'lista', label: 'Lista', icon: IconList },
] as const;

type Visao = (typeof VISOES)[number]['chave'];
type ResultadoDashboard = Ocorrencia[] | Record<string, Ocorrencia[]>;

// Ordem do fluxo completo, do jeito que o quadro kanban mostra as colunas
// (deve bater com ETAPAS_KANBAN em backend/src/usuarios/usuarios.service.ts).
const ETAPAS_KANBAN: StatusOcorrencia[] = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'AVALIACAO',
  'CANCELAMENTO',
];

const CATEGORIAS = ['iluminacao', 'equipamento', 'vazamento', 'acessibilidade', 'seguranca', 'manutencao', 'outro'];
const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const PERIODOS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
  { label: 'Tudo', dias: undefined },
];

function tituloColuna(status: StatusOcorrencia): string {
  return status === 'ABERTURA' ? 'Nova ocorrência' : LABEL_STATUS[status];
}

interface Filtros {
  categoria: string;
  blocoId: string;
  responsavelFuncionarioId: string;
  prioridade: string;
  status: string;
  periodoDias: number | undefined;
  dataInicio: string;
  dataFim: string;
}

const FILTROS_PADRAO: Filtros = {
  categoria: '',
  blocoId: '',
  responsavelFuncionarioId: '',
  prioridade: '',
  status: '',
  periodoDias: 30,
  dataInicio: '',
  dataFim: '',
};

interface Arrasto {
  id: string;
  deStatus: StatusOcorrencia;
  permitidos: StatusOcorrencia[];
}

function CartaoKanban({
  ocorrencia,
  arrastavel,
  aoIniciarArrasto,
  aoTerminarArrasto,
  aoAbrir,
}: {
  ocorrencia: Ocorrencia;
  arrastavel: boolean;
  aoIniciarArrasto: () => void;
  aoTerminarArrasto: () => void;
  aoAbrir: (id: string) => void;
}) {
  const urgente = ocorrencia.prioridade === 'URGENTE';
  return (
    <a
      href={`/ocorrencias/${ocorrencia.id}`}
      className="kanban-card"
      draggable={arrastavel}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', ocorrencia.id);
        e.dataTransfer.effectAllowed = 'move';
        aoIniciarArrasto();
      }}
      onDragEnd={aoTerminarArrasto}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        aoAbrir(ocorrencia.id);
      }}
    >
      <span className={`categoria-badge${urgente ? ' urgente' : ''}`}>
        {urgente ? 'Urgente' : (LABEL_CATEGORIA[ocorrencia.categoria] ?? ocorrencia.categoria)}
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

function ColunaKanban({
  status,
  itens,
  arrasto,
  aoIniciarArrasto,
  aoTerminarArrasto,
  aoSoltar,
  aoAbrir,
}: {
  status: StatusOcorrencia;
  itens: Ocorrencia[];
  arrasto: Arrasto | null;
  aoIniciarArrasto: (ocorrencia: Ocorrencia) => void;
  aoTerminarArrasto: () => void;
  aoSoltar: (statusDestino: StatusOcorrencia) => void;
  aoAbrir: (id: string) => void;
}) {
  const alvoValido = Boolean(arrasto && arrasto.permitidos.includes(status));
  return (
    <div
      className={`coluna${alvoValido ? ' coluna-alvo' : ''}`}
      onDragOver={(e) => {
        if (alvoValido) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (alvoValido) aoSoltar(status);
      }}
    >
      <div className="coluna-header">
        <span className="coluna-dot" style={{ background: COR_STATUS[status] }} />
        <span className="coluna-titulo">{tituloColuna(status)}</span>
        <span className="coluna-count">{itens.length}</span>
      </div>
      {itens.map((o) => (
        <CartaoKanban
          key={o.id}
          ocorrencia={o}
          arrastavel={arrasto === null || arrasto.id === o.id}
          aoIniciarArrasto={() => aoIniciarArrasto(o)}
          aoTerminarArrasto={aoTerminarArrasto}
          aoAbrir={aoAbrir}
        />
      ))}
    </div>
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
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState(false);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<string | null>(null);

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

  const buscarDashboard = useCallback(() => {
    const rota = perfil?.role === 'GESTOR' ? '/gestor/dashboard' : '/funcionario/dashboard';
    const params = new URLSearchParams({ view: visao });
    if (buscaAplicada) params.set('q', buscaAplicada);
    if (filtros.categoria) params.set('categoria', filtros.categoria);
    if (filtros.blocoId) params.set('blocoId', filtros.blocoId);
    if (filtros.responsavelFuncionarioId) params.set('responsavelFuncionarioId', filtros.responsavelFuncionarioId);
    if (filtros.prioridade) params.set('prioridade', filtros.prioridade);
    if (filtros.status) params.set('status', filtros.status);
    if (filtros.dataInicio && filtros.dataFim) {
      params.set('dataInicio', filtros.dataInicio);
      params.set('dataFim', filtros.dataFim);
    } else if (filtros.periodoDias) {
      params.set('periodoDias', String(filtros.periodoDias));
    }
    return api.get<ResultadoDashboard>(`${rota}?${params.toString()}`);
  }, [visao, perfil, buscaAplicada, filtros]);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao trocar de aba/visao/filtro, padrao de data fetching em effect
    setCarregando(true);
    buscarDashboard().then((r) => {
      // Evita que uma resposta antiga (de um filtro ja trocado) sobrescreva
      // uma mais recente que tenha chegado primeiro.
      if (cancelado) return;
      setDados(r);
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [buscarDashboard]);

  const filtrosAtivos = useMemo(
    () =>
      Boolean(
        filtros.categoria ||
          filtros.blocoId ||
          filtros.responsavelFuncionarioId ||
          filtros.prioridade ||
          filtros.status ||
          filtros.periodoDias !== FILTROS_PADRAO.periodoDias ||
          filtros.dataInicio ||
          filtros.dataFim,
      ),
    [filtros],
  );

  function limparFiltro<K extends keyof Filtros>(chave: K) {
    setFiltros((atual) => ({ ...atual, [chave]: FILTROS_PADRAO[chave] }));
  }

  function limparPeriodo() {
    setPeriodoPersonalizado(false);
    setFiltros((atual) => ({ ...atual, periodoDias: FILTROS_PADRAO.periodoDias, dataInicio: '', dataFim: '' }));
  }

  function iniciarArrasto(ocorrencia: Ocorrencia) {
    if (!perfil?.role) return;
    // Funcionario so pode mover ocorrencias atribuidas a ele mesmo (mesma
    // regra de posse do backend, so pra nao oferecer um arrasto que o
    // servidor vai rejeitar).
    if (perfil.role === 'FUNCIONARIO' && ocorrencia.responsavelFuncionarioId !== perfil.id) {
      setArrasto({ id: ocorrencia.id, deStatus: ocorrencia.statusAtual, permitidos: [] });
      return;
    }
    const permitidos = transicoesPermitidas(ocorrencia.statusAtual, perfil.role);
    setArrasto({ id: ocorrencia.id, deStatus: ocorrencia.statusAtual, permitidos });
  }

  async function soltarEm(statusDestino: StatusOcorrencia) {
    const atual = arrasto;
    setArrasto(null);
    if (!atual || !atual.permitidos.includes(statusDestino)) return;
    try {
      await api.patch(`/ocorrencias/${atual.id}/status`, { status: statusDestino });
      const atualizado = await buscarDashboard();
      setDados(atualizado);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Não foi possível mover a ocorrência.');
    }
  }

  async function aoAlterarOcorrenciaAberta() {
    const atualizado = await buscarDashboard();
    setDados(atualizado);
  }

  return (
    <div className="ocorrencias-page">
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

        <FiltroDropdown
          label="Status"
          valorSelecionado={filtros.status}
          ativo={filtros.status !== ''}
          opcoes={[
            { valor: '', texto: 'Todos' },
            ...ETAPAS_KANBAN.map((s) => ({ valor: s, texto: LABEL_STATUS[s] })),
          ]}
          aoSelecionar={(v) => setFiltros((f) => ({ ...f, status: v }))}
          aoLimpar={() => limparFiltro('status')}
        />

        <FiltroDropdown
          label="Prioridade"
          valorSelecionado={filtros.prioridade}
          ativo={filtros.prioridade !== ''}
          opcoes={[
            { valor: '', texto: 'Todas' },
            ...PRIORIDADES.map((p) => ({ valor: p, texto: p.charAt(0) + p.slice(1).toLowerCase() })),
          ]}
          aoSelecionar={(v) => setFiltros((f) => ({ ...f, prioridade: v }))}
          aoLimpar={() => limparFiltro('prioridade')}
        />

        <FiltroDropdown
          label="Categoria"
          valorSelecionado={filtros.categoria}
          ativo={filtros.categoria !== ''}
          opcoes={[{ valor: '', texto: 'Todas' }, ...CATEGORIAS.map((c) => ({ valor: c, texto: LABEL_CATEGORIA[c] ?? c }))]}
          aoSelecionar={(v) => setFiltros((f) => ({ ...f, categoria: v }))}
          aoLimpar={() => limparFiltro('categoria')}
        />

        <FiltroDropdown
          label="Bloco"
          valorSelecionado={filtros.blocoId}
          ativo={filtros.blocoId !== ''}
          opcoes={[{ valor: '', texto: 'Todos' }, ...blocos.map((b) => ({ valor: b.id, texto: b.nome }))]}
          aoSelecionar={(v) => setFiltros((f) => ({ ...f, blocoId: v }))}
          aoLimpar={() => limparFiltro('blocoId')}
        />

        {perfil?.role === 'GESTOR' && (
          <FiltroDropdown
            label="Responsável"
            valorSelecionado={filtros.responsavelFuncionarioId}
            ativo={filtros.responsavelFuncionarioId !== ''}
            opcoes={[
              { valor: '', texto: 'Todos' },
              ...funcionarios.map((f) => ({ valor: f.id, texto: f.nomeCompleto })),
            ]}
            aoSelecionar={(v) => setFiltros((f) => ({ ...f, responsavelFuncionarioId: v }))}
            aoLimpar={() => limparFiltro('responsavelFuncionarioId')}
          />
        )}

        <FiltroDropdown
          label="Período"
          valorSelecionado={periodoPersonalizado ? 'custom' : filtros.periodoDias ? String(filtros.periodoDias) : ''}
          ativo={filtros.periodoDias !== FILTROS_PADRAO.periodoDias || periodoPersonalizado}
          opcoes={[
            ...PERIODOS.map((p) => ({ valor: p.dias ? String(p.dias) : '', texto: p.label })),
            { valor: 'custom', texto: 'Personalizado' },
          ]}
          aoSelecionar={(v) => {
            if (v === 'custom') {
              setPeriodoPersonalizado(true);
              setFiltros((f) => ({ ...f, periodoDias: undefined }));
            } else {
              setPeriodoPersonalizado(false);
              setFiltros((f) => ({ ...f, periodoDias: v ? Number(v) : undefined, dataInicio: '', dataFim: '' }));
            }
          }}
          aoLimpar={limparPeriodo}
        />

        {periodoPersonalizado && (
          <div className="row periodo-personalizado">
            <input
              type="date"
              aria-label="Data inicial"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))}
            />
            <span className="muted">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))}
            />
          </div>
        )}

        {filtrosAtivos && (
          <button
            type="button"
            className="filtros-limpar-todos"
            onClick={() => {
              setPeriodoPersonalizado(false);
              setFiltros(FILTROS_PADRAO);
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {carregando && <p className="muted">Carregando...</p>}

      {!carregando && visao === 'lista' && (
        <div className="stack">
          {(dados as Ocorrencia[]).map((o) => (
            <OcorrenciaCard key={o.id} ocorrencia={o} aoAbrir={setOcorrenciaAbertaId} />
          ))}
          {(dados as Ocorrencia[]).length === 0 && <p className="muted">Nenhuma ocorrência encontrada.</p>}
        </div>
      )}

      {!carregando && visao === 'kanban' && (
        <div className="kanban">
          {ETAPAS_KANBAN.map((status) => (
            <ColunaKanban
              key={status}
              status={status}
              itens={(dados as Record<string, Ocorrencia[]>)[status] ?? []}
              arrasto={arrasto}
              aoIniciarArrasto={iniciarArrasto}
              aoTerminarArrasto={() => setArrasto(null)}
              aoSoltar={soltarEm}
              aoAbrir={setOcorrenciaAbertaId}
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
                    <a
                      key={o.id}
                      href={`/ocorrencias/${o.id}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        setOcorrenciaAbertaId(o.id);
                      }}
                    >
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

      {ocorrenciaAbertaId && (
        <OcorrenciaModal
          id={ocorrenciaAbertaId}
          aoFechar={() => setOcorrenciaAbertaId(null)}
          aoAlterar={aoAlterarOcorrenciaAberta}
        />
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
