'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import type { Visitante } from '@/lib/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function ConteudoVisitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [dataVisita, setDataVisita] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const dados = await api.get<Visitante[]>('/visitantes');
    setVisitantes(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
     
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/visitantes', { nome, documento: documento || undefined, dataVisita, observacao: observacao || undefined });
      setNome('');
      setDocumento('');
      setDataVisita('');
      setObservacao('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível autorizar o visitante.');
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover a autorização deste visitante?')) return;
    await api.delete(`/visitantes/${id}`);
    await carregar();
  }

  return (
    <div className="stack">
      <h1>Visitantes</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>Autorizar visitante</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="nome">Nome</label>
            <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="documento">Documento (opcional)</label>
            <input id="documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="dataVisita">Data da visita</label>
          <input id="dataVisita" type="date" required value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="observacao">Observação (opcional)</label>
          <input id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn-primary">
          Autorizar
        </button>
      </form>

      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && visitantes.length === 0 && <p className="muted">Nenhum visitante autorizado ainda.</p>}
      <div className="stack">
        {visitantes.map((v) => (
          <div key={v.id} className="card row-between">
            <div>
              <strong>{v.nome}</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                Visita em {formatarData(v.dataVisita)}
                {v.documento ? ` · ${v.documento}` : ''}
              </p>
              {v.observacao && <p className="muted">{v.observacao}</p>}
            </div>
            <button className="btn-danger" onClick={() => remover(v.id)}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VisitantesPage() {
  return (
    <RequireAuth papeis={['USUARIO']}>
      <ConteudoVisitantes />
    </RequireAuth>
  );
}
