'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { ITENS_BOTTOM_NAV, iniciais, itensParaPerfil } from '@/components/Sidebar';
import { IconChevronLeft, IconLogOut, IconUser } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PerfilFuncionarioOuGestor, PerfilUsuario } from '@/lib/types';

const LABEL_PERFIL: Record<string, string> = {
  USUARIO: 'Morador',
  FUNCIONARIO: 'Funcionário',
  GESTOR: 'Gestor',
};

function FormularioMeusDados() {
  const { perfil, recarregarPerfil } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState(perfil?.nomeCompleto ?? '');
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      await api.patch('/usuarios/me', { nomeCompleto, telefone });
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
        <label htmlFor="telefone">Telefone</label>
        <input id="telefone" value={telefone ?? ''} onChange={(e) => setTelefone(e.target.value)} />
      </div>
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
  const [editando, setEditando] = useState(false);

  async function handleSair() {
    await sair();
    router.push('/login');
  }

  if (!perfil) return null;

  const unidade =
    perfil.role === 'USUARIO'
      ? (perfil as PerfilUsuario).predio?.nome
      : (perfil as PerfilFuncionarioOuGestor).predios?.map((p) => p.predio.nome).join(', ');

  const todos = itensParaPerfil(perfil.role);
  const hrefsNaBarra = new Set(perfil.role ? ITENS_BOTTOM_NAV[perfil.role] : []);
  const extras = todos.filter((item) => !hrefsNaBarra.has(item.href) && item.href !== '/area-usuario');

  return (
    <div className="stack">
      <h1>Perfil</h1>

      <div className="card row" style={{ gap: 14 }}>
        <span className="avatar" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
          {iniciais(perfil.nomeCompleto)}
        </span>
        <div>
          <strong style={{ display: 'block' }}>{perfil.nomeCompleto}</strong>
          <span className="muted">
            {unidade ? `${unidade} · ` : ''}
            {LABEL_PERFIL[perfil.role ?? ''] ?? perfil.role}
          </span>
        </div>
      </div>

      {extras.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <p className="muted" style={{ padding: '14px 16px 4px', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.03em' }}>
            Navegação
          </p>
          {extras.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="row-between"
                style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}
              >
                <span className="row" style={{ gap: 10 }}>
                  <Icon style={{ width: 18, height: 18 }} />
                  {item.label}
                </span>
                <IconChevronLeft style={{ width: 16, height: 16, transform: 'rotate(180deg)', opacity: 0.5 }} />
              </Link>
            );
          })}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <p className="muted" style={{ padding: '14px 16px 4px', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.03em' }}>
          Minha conta
        </p>
        <button
          onClick={() => setEditando((v) => !v)}
          className="row-between"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderTop: '1px solid var(--border)',
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
            borderRadius: 0,
            background: 'transparent',
            fontWeight: 400,
          }}
        >
          <span className="row" style={{ gap: 10 }}>
            <IconUser style={{ width: 18, height: 18 }} />
            Meus dados
          </span>
          <IconChevronLeft
            style={{
              width: 16,
              height: 16,
              opacity: 0.5,
              transform: editando ? 'rotate(90deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {editando && <FormularioMeusDados />}

      <button className="btn-danger" onClick={handleSair} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
