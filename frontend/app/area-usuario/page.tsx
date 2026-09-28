'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { PageTopBar } from '@/components/PageTopBar';
import { RequireAuth } from '@/components/RequireAuth';
import { iniciais } from '@/components/Sidebar';
import { IconLogOut } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PerfilFuncionarioOuGestor, PerfilUsuario, TipoVinculo } from '@/lib/types';

const LABEL_PERFIL: Record<string, string> = {
  USUARIO: 'Morador',
  FUNCIONARIO: 'Funcionário',
  GESTOR: 'Gestor',
};

const LABEL_VINCULO: Record<TipoVinculo, string> = {
  PROPRIETARIO: 'Proprietário',
  INQUILINO: 'Inquilino',
};

function FormularioPerfil() {
  const { perfil, recarregarPerfil } = useAuth();
  const usuario = perfil as PerfilUsuario;

  const [nomeCompleto, setNomeCompleto] = useState(perfil?.nomeCompleto ?? '');
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '');
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>(usuario.tipoVinculo ?? 'PROPRIETARIO');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      await api.patch('/usuarios/me', {
        nomeCompleto,
        telefone,
        ...(perfil?.role === 'USUARIO' ? { tipoVinculo } : {}),
      });
      await recarregarPerfil();
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Meus dados</h2>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="nomeCompleto">Nome completo</label>
        <input id="nomeCompleto" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" value={perfil?.email ?? ''} disabled />
      </div>
      <div className="field">
        <label htmlFor="telefone">Telefone</label>
        <input id="telefone" value={telefone ?? ''} onChange={(e) => setTelefone(e.target.value)} />
      </div>

      {perfil?.role === 'USUARIO' && (
        <>
          <div className="field">
            <label htmlFor="tipoVinculo">Você é</label>
            <select
              id="tipoVinculo"
              value={tipoVinculo}
              onChange={(e) => setTipoVinculo(e.target.value as TipoVinculo)}
            >
              <option value="PROPRIETARIO">Proprietário</option>
              <option value="INQUILINO">Inquilino</option>
            </select>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Bloco</label>
              <input value={usuario.apartamento?.bloco?.nome ?? '—'} disabled />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Apartamento</label>
              <input value={usuario.apartamento?.numero ?? '—'} disabled />
            </div>
          </div>
        </>
      )}

      {erro && <p className="erro">{erro}</p>}
      {sucesso && <p style={{ color: 'var(--success)' }}>Dados atualizados.</p>}
      <button type="submit" className="btn-primary" disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  );
}

function ConteudoAreaUsuario() {
  const { perfil, sair } = useAuth();
  const router = useRouter();

  async function handleSair() {
    await sair();
    router.push('/login');
  }

  if (!perfil) return null;

  const unidade =
    perfil.role === 'USUARIO'
      ? (perfil as PerfilUsuario).predio?.nome
      : (perfil as PerfilFuncionarioOuGestor).predios?.map((p) => p.predio.nome).join(', ');

  return (
    <div className="stack">
      <PageTopBar title="Área do usuário" />

      <div className="card row" style={{ gap: 14 }}>
        <span className="avatar" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
          {iniciais(perfil.nomeCompleto)}
        </span>
        <div>
          <strong style={{ display: 'block' }}>{perfil.nomeCompleto}</strong>
          <span className="muted">
            {unidade ? `${unidade} · ` : ''}
            {perfil.role === 'USUARIO' && (perfil as PerfilUsuario).tipoVinculo
              ? `${LABEL_VINCULO[(perfil as PerfilUsuario).tipoVinculo]} · `
              : ''}
            {LABEL_PERFIL[perfil.role ?? ''] ?? perfil.role}
          </span>
        </div>
      </div>

      <FormularioPerfil />

      <button
        className="btn-danger"
        onClick={handleSair}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <IconLogOut style={{ width: 16, height: 16 }} />
        Sair da conta
      </button>
    </div>
  );
}

export default function AreaUsuarioPage() {
  return (
    <RequireAuth>
      <ConteudoAreaUsuario />
    </RequireAuth>
  );
}
