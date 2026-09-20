'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Encomenda, PerfilUsuario } from '@/lib/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function RegistrarEncomendaForm({ aoCriar }: { aoCriar: () => void }) {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<PerfilUsuario[]>('/gestor/usuarios').then(setUsuarios);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/encomendas', { usuarioId, descricao: descricao || undefined });
      setUsuarioId('');
      setDescricao('');
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar a encomenda.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Registrar chegada</h2>
      <div className="row" style={{ marginTop: 8 }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="usuarioId">Destinatário</label>
          <select id="usuarioId" required value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">Selecione...</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nomeCompleto}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="descricao">Descrição (opcional)</label>
          <input
            id="descricao"
            placeholder="Ex: Mercado Livre"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Registrar
      </button>
    </form>
  );
}

function ConteudoEncomendas() {
  const { perfil } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const dados = await api.get<Encomenda[]>('/encomendas');
    setEncomendas(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
     
  }, []);

  async function marcarRetirada(id: string) {
    await api.patch(`/encomendas/${id}/retirar`);
    await carregar();
  }

  return (
    <div className="stack">
      <h1>Encomendas</h1>

      {(perfil?.role === 'FUNCIONARIO' || perfil?.role === 'GESTOR') && (
        <RegistrarEncomendaForm aoCriar={carregar} />
      )}

      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && encomendas.length === 0 && <p className="muted">Nenhuma encomenda por aqui.</p>}
      <div className="stack">
        {encomendas.map((enc) => (
          <div key={enc.id} className="card row-between">
            <div>
              <strong>{enc.descricao || 'Encomenda'}</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                Chegou em {formatarData(enc.chegadaEm)}
              </p>
            </div>
            <div className="row">
              <span className={`badge ${enc.status === 'RETIRADA' ? 'badge-RESOLVIDA' : 'badge-ANALISE'}`}>
                {enc.status === 'RETIRADA' ? 'Retirada' : 'Aguardando retirada'}
              </span>
              {enc.status !== 'RETIRADA' && (
                <button className="btn-primary" onClick={() => marcarRetirada(enc.id)}>
                  Marcar retirada
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EncomendasPage() {
  return (
    <RequireAuth>
      <ConteudoEncomendas />
    </RequireAuth>
  );
}
