'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { IconSearch } from '@/components/icons';
import { api } from '@/lib/api';
import type { PerfilFuncionarioOuGestor, PerfilUsuario } from '@/lib/types';

type TipoLinha = 'FUNCIONARIO' | 'PROPRIETARIO' | 'INQUILINO';

interface LinhaUsuario {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  tipo: TipoLinha;
  localizacao: string | null;
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

  useEffect(() => {
    async function carregar() {
      const [usuarios, funcionarios] = await Promise.all([
        api.get<PerfilUsuario[]>('/gestor/usuarios'),
        api.get<PerfilFuncionarioOuGestor[]>('/gestor/funcionarios'),
      ]);

      const linhasUsuarios: LinhaUsuario[] = usuarios.map((u) => ({
        id: u.id,
        nomeCompleto: u.nomeCompleto,
        email: u.email,
        telefone: u.telefone,
        tipo: u.tipoVinculo,
        localizacao: u.apartamento
          ? `${u.apartamento.bloco?.nome ?? 'Bloco'} · apto ${u.apartamento.numero}`
          : null,
      }));
      const linhasFuncionarios: LinhaUsuario[] = funcionarios.map((f) => ({
        id: f.id,
        nomeCompleto: f.nomeCompleto,
        email: f.email,
        telefone: f.telefone,
        tipo: 'FUNCIONARIO',
        localizacao: f.area ?? null,
      }));

      setLinhas([...linhasFuncionarios, ...linhasUsuarios].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
      setCarregando(false);
    }
    carregar();
  }, []);

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
      <PageTopBar title="Usuários" />
      <p className="muted">Funcionários, proprietários e inquilinos vinculados ao prédio.</p>

      <div className="dashboard-toolbar">
        <label className="dashboard-busca">
          <IconSearch />
          <input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
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
