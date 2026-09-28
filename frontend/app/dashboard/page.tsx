'use client';

import { useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { COR_STATUS, LABEL_STATUS, tempoRelativo } from '@/lib/formatacao';
import type { Ocorrencia, PerfilFuncionarioOuGestor, StatusOcorrencia } from '@/lib/types';

const VISOES_FUNCIONARIO = ['kanban', 'calendario', 'lista', 'prioridades'] as const;
const VISOES_GESTOR = [...VISOES_FUNCIONARIO, 'funcionarios', 'areas'] as const;

type Visao = (typeof VISOES_GESTOR)[number];
type ResultadoDashboard = Ocorrencia[] | Record<string, Ocorrencia[]>;

function CartaoKanban({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  const urgente = ocorrencia.prioridade === 'URGENTE';
  return (
    <a href={`/ocorrencias/${ocorrencia.id}`} className="kanban-card">
      <span className={`categoria-badge${urgente ? ' urgente' : ''}`}>
        {urgente ? 'Urgente' : ocorrencia.categoria}
      </span>
      <strong>{ocorrencia.titulo}</strong>
      {ocorrencia.usuario && <span className="autor">{ocorrencia.usuario.nomeCompleto}</span>}
      <span className="tempo">{tempoRelativo(ocorrencia.criadoEm)}</span>
    </a>
  );
}

function ColunaKanban({
  titulo,
  itens,
  cor,
}: {
  titulo: string;
  itens: Ocorrencia[];
  cor?: string;
}) {
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

function ConteudoDashboard() {
  const { perfil } = useAuth();
  const visoes = perfil?.role === 'GESTOR' ? VISOES_GESTOR : VISOES_FUNCIONARIO;
  const [visao, setVisao] = useState<Visao>('kanban');
  const [dados, setDados] = useState<ResultadoDashboard>([]);
  const [funcionarios, setFuncionarios] = useState<PerfilFuncionarioOuGestor[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (perfil?.role === 'GESTOR') {
      api.get<PerfilFuncionarioOuGestor[]>('/gestor/funcionarios').then(setFuncionarios);
    }
  }, [perfil]);

  useEffect(() => {
    const rota = perfil?.role === 'GESTOR' ? '/gestor/dashboard' : '/funcionario/dashboard';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao trocar de aba/visao, padrao de data fetching em effect
    setCarregando(true);
    api.get<ResultadoDashboard>(`${rota}?view=${visao}`).then((r) => {
      setDados(r);
      setCarregando(false);
    });
  }, [visao, perfil]);

  function nomeFuncionario(id: string) {
    if (id === 'SEM_RESPONSAVEL') return 'Sem responsável';
    return funcionarios.find((f) => f.id === id)?.nomeCompleto ?? id;
  }

  return (
    <div>
      <h1>Ocorrências</h1>
      <div className="tabs">
        {visoes.map((v) => (
          <button key={v} className={v === visao ? 'ativo' : ''} onClick={() => setVisao(v)}>
            {v}
          </button>
        ))}
      </div>

      {carregando && <p className="muted">Carregando...</p>}

      {!carregando && visao === 'lista' && (
        <div className="stack">
          {(dados as Ocorrencia[]).map((o) => (
            <OcorrenciaCard key={o.id} ocorrencia={o} />
          ))}
        </div>
      )}

      {!carregando && visao === 'kanban' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([status, itens]) => (
            <ColunaKanban
              key={status}
              titulo={LABEL_STATUS[status as StatusOcorrencia] ?? status}
              itens={itens}
              cor={COR_STATUS[status as StatusOcorrencia]}
            />
          ))}
        </div>
      )}

      {!carregando && visao === 'prioridades' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([prioridade, itens]) => (
            <ColunaKanban key={prioridade} titulo={prioridade} itens={itens} />
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
        </div>
      )}

      {!carregando && visao === 'funcionarios' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([funcionarioId, itens]) => (
            <ColunaKanban key={funcionarioId} titulo={nomeFuncionario(funcionarioId)} itens={itens} />
          ))}
        </div>
      )}

      {!carregando && visao === 'areas' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([area, itens]) => (
            <ColunaKanban key={area} titulo={area} itens={itens} />
          ))}
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
