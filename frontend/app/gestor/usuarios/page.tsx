'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconSearch } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import type { PerfilFuncionarioOuGestor, PerfilUsuario } from '@/lib/types';

type TipoLinha = 'FUNCIONARIO' | 'PROPRIETARIO' | 'INQUILINO';

interface LinhaUsuario {
  id: string;
  rota: 'usuarios' | 'funcionarios';
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  tipo: TipoLinha;
  localizacao: string | null;
  ativo: boolean;
}

const LABEL_TIPO: Record<TipoLinha, string> = {
  FUNCIONARIO: 'Funcionário',
  PROPRIETARIO: 'Proprietário',
  INQUILINO: 'Inquilino',
};

const FILTROS_TIPO: { valor: TipoLinha | ''; texto: string }[] = [
  { valor: '', texto: 'Todos' },
  { valor: 'FUNCIONARIO', texto: 'Funcionários' },
  { valor: 'PROPRIETARIO', texto: 'Proprietários' },
  { valor: 'INQUILINO', texto: 'Inquilinos' },
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function ConteudoUsuarios() {
  const [linhas, setLinhas] = useState<LinhaUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoLinha | ''>('');

  const carregar = useCallback(async () => {
    const [usuarios, funcionarios] = await Promise.all([
      api.get<PerfilUsuario[]>('/gestor/usuarios'),
      api.get<PerfilFuncionarioOuGestor[]>('/gestor/funcionarios'),
    ]);

    const linhasUsuarios: LinhaUsuario[] = usuarios.map((u) => ({
      id: u.id,
      rota: 'usuarios',
      nomeCompleto: u.nomeCompleto,
      email: u.email,
      telefone: u.telefone,
      tipo: u.tipoVinculo,
      localizacao: u.apartamento
        ? `${u.apartamento.bloco?.nome ?? 'Bloco'} · apto ${u.apartamento.numero}`
        : null,
      ativo: u.ativo ?? true,
    }));
    const linhasFuncionarios: LinhaUsuario[] = funcionarios.map((f) => ({
      id: f.id,
      rota: 'funcionarios',
      nomeCompleto: f.nomeCompleto,
      email: f.email,
      telefone: f.telefone,
      tipo: 'FUNCIONARIO',
      localizacao: f.area ?? null,
      ativo: f.ativo ?? true,
    }));

    setLinhas([...linhasFuncionarios, ...linhasUsuarios].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
    setCarregando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, padrao de data fetching em effect
    carregar();
  }, [carregar]);

  async function handleBloqueio(linha: LinhaUsuario) {
    try {
      await api.patch(`/gestor/${linha.rota}/${linha.id}/bloqueio`, { ativo: !linha.ativo });
      await carregar();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Não foi possível atualizar o bloqueio.');
    }
  }

  async function handleExcluir(linha: LinhaUsuario) {
    if (!confirm(`Excluir "${linha.nomeCompleto}" permanentemente?`)) return;
    try {
      await api.delete(`/gestor/${linha.rota}/${linha.id}`);
      await carregar();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Não foi possível excluir.');
    }
  }

  const linhasFiltradas = useMemo(() => {
    const termo = normalizar(busca);
    return linhas.filter((l) => {
      if (filtroTipo && l.tipo !== filtroTipo) return false;
      if (termo && !normalizar(l.nomeCompleto).includes(termo) && !normalizar(l.email).includes(termo)) return false;
      return true;
    });
  }, [linhas, busca, filtroTipo]);

  return (
    <div className="stack">
      <PageTopBar title="Usuários">
        <label className="dashboard-busca">
          <IconSearch />
          <input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </PageTopBar>
      <p className="muted">Funcionários, proprietários e inquilinos vinculados ao prédio.</p>

      <div className="dashboard-toolbar">
        <div className="tabs">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.valor}
              className={f.valor === filtroTipo ? 'ativo' : ''}
              onClick={() => setFiltroTipo(f.valor)}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      {carregando && <p className="muted">Carregando...</p>}

      <div className="card">
        <div className="stack">
          {linhasFiltradas.map((l) => (
            <div key={`${l.tipo}-${l.id}`} className="row-between">
              <div>
                <strong>{l.nomeCompleto}</strong>
                <p className="muted">
                  {l.email}
                  {l.telefone ? ` · ${l.telefone}` : ''}
                </p>
              </div>
              <div className="row">
                {l.localizacao && <span className="muted">{l.localizacao}</span>}
                <span
                  className={`badge ${l.tipo === 'FUNCIONARIO' ? 'badge-ATENDIMENTO' : l.tipo === 'PROPRIETARIO' ? 'badge-RESOLVIDA' : 'badge-ANALISE'}`}
                >
                  {LABEL_TIPO[l.tipo]}
                </span>
                {!l.ativo && <span className="badge badge-CANCELAMENTO">Bloqueado</span>}
                <button type="button" onClick={() => handleBloqueio(l)}>
                  {l.ativo ? 'Bloquear' : 'Desbloquear'}
                </button>
                <button type="button" className="btn-danger" onClick={() => handleExcluir(l)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {!carregando && linhasFiltradas.length === 0 && <p className="muted">Nenhum usuário encontrado.</p>}
        </div>
      </div>
    </div>
  );
}

export default function GestorUsuariosPage() {
  return (
    <RequireAuth papeis={['GESTOR']}>
      <ConteudoUsuarios />
    </RequireAuth>
  );
}
