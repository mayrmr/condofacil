'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Fatura, PerfilUsuario } from '@/lib/types';

const LABEL_STATUS_FATURA: Record<string, string> = {
  EM_ABERTO: 'Em aberto',
  PAGA: 'Paga',
  ATRASADA: 'Atrasada',
};

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function NovaFaturaForm({ aoCriar }: { aoCriar: () => void }) {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<PerfilUsuario[]>('/gestor/usuarios').then(setUsuarios);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/financeiro', {
        usuarioId,
        competencia,
        valorCentavos: Math.round(Number(valor.replace(',', '.')) * 100),
        vencimento,
      });
      setCompetencia('');
      setValor('');
      setVencimento('');
      aoCriar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a fatura.');
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Nova fatura</h2>
      <div className="field" style={{ marginTop: 8 }}>
        <label htmlFor="usuarioId">Morador</label>
        <select id="usuarioId" required value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
          <option value="">Selecione...</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nomeCompleto}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="competencia">Competência</label>
          <input
            id="competencia"
            required
            placeholder="Ex: 2026-09"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="valor">Valor (R$)</label>
          <input id="valor" required placeholder="458,00" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="vencimento">Vencimento</label>
        <input
          id="vencimento"
          type="date"
          required
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
        />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primary">
        Criar fatura
      </button>
    </form>
  );
}

function ConteudoFinanceiro() {
  const { perfil } = useAuth();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const dados = await api.get<Fatura[]>('/financeiro');
    setFaturas(dados);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
     
  }, []);

  async function pagar(id: string) {
    await api.patch(`/financeiro/${id}/pagar`);
    await carregar();
  }

  const emAberto = faturas.filter((f) => f.status !== 'PAGA').reduce((soma, f) => soma + f.valorCentavos, 0);
  const pago = faturas.filter((f) => f.status === 'PAGA').reduce((soma, f) => soma + f.valorCentavos, 0);

  return (
    <div className="stack">
      <h1>Financeiro</h1>

      {perfil?.role === 'USUARIO' && (
        <div className="card" style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)', border: 'none' }}>
          <div className="row-between">
            <div>
              <span className="muted" style={{ color: 'var(--sidebar-muted)' }}>
                Em aberto
              </span>
              <h2 style={{ color: 'var(--sidebar-fg)' }}>{formatarMoeda(emAberto)}</h2>
            </div>
            <div>
              <span className="muted" style={{ color: 'var(--sidebar-muted)' }}>
                Pago
              </span>
              <h2 style={{ color: 'var(--sidebar-fg)' }}>{formatarMoeda(pago)}</h2>
            </div>
          </div>
        </div>
      )}

      {perfil?.role === 'GESTOR' && <NovaFaturaForm aoCriar={carregar} />}

      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && faturas.length === 0 && <p className="muted">Nenhuma fatura por aqui ainda.</p>}
      <div className="stack">
        {faturas.map((f) => (
          <div key={f.id} className="card row-between">
            <div>
              <strong>{f.competencia}</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                Vencimento {formatarData(f.vencimento)} · {formatarMoeda(f.valorCentavos)}
              </p>
            </div>
            <div className="row">
              <span className={`badge badge-${f.status === 'PAGA' ? 'RESOLVIDA' : f.status === 'ATRASADA' ? 'CANCELAMENTO' : 'ABERTURA'}`}>
                {LABEL_STATUS_FATURA[f.status]}
              </span>
              {perfil?.role === 'USUARIO' && f.status !== 'PAGA' && (
                <button className="btn-primary" onClick={() => pagar(f.id)}>
                  Pagar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <RequireAuth papeis={['USUARIO', 'GESTOR']}>
      <ConteudoFinanceiro />
    </RequireAuth>
  );
}
