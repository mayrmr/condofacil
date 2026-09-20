'use client';

import { useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { LABEL_STATUS } from '@/lib/formatacao';
import type { Ocorrencia, PerfilFuncionarioOuGestor } from '@/lib/types';

const VISOES_FUNCIONARIO = ['kanban', 'calendario', 'lista', 'prioridades'] as const;
const VISOES_GESTOR = [...VISOES_FUNCIONARIO, 'funcionarios', 'areas'] as const;

type Visao = (typeof VISOES_GESTOR)[number];
type ResultadoDashboard = Ocorrencia[] | Record<string, Ocorrencia[]>;

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
      <h1>Dashboard</h1>
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
            <div key={status} className="coluna">
              <h3>{LABEL_STATUS[status as keyof typeof LABEL_STATUS] ?? status}</h3>
              {itens.map((o) => (
                <a key={o.id} href={`/ocorrencias/${o.id}`} className="item">
                  {o.titulo}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      {!carregando && visao === 'prioridades' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([prioridade, itens]) => (
            <div key={prioridade} className="coluna">
              <h3>{prioridade}</h3>
              {itens.map((o) => (
                <a key={o.id} href={`/ocorrencias/${o.id}`} className="item">
                  {o.titulo}
                </a>
              ))}
            </div>
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
            <div key={funcionarioId} className="coluna">
              <h3>{nomeFuncionario(funcionarioId)}</h3>
              {itens.map((o) => (
                <a key={o.id} href={`/ocorrencias/${o.id}`} className="item">
                  {o.titulo}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      {!carregando && visao === 'areas' && (
        <div className="kanban">
          {Object.entries(dados as Record<string, Ocorrencia[]>).map(([area, itens]) => (
            <div key={area} className="coluna">
              <h3>{area}</h3>
              {itens.map((o) => (
                <a key={o.id} href={`/ocorrencias/${o.id}`} className="item">
                  {o.titulo}
                </a>
              ))}
            </div>
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
