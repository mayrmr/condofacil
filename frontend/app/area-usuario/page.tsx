'use client';

import { useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PerfilFuncionarioOuGestor, PerfilUsuario } from '@/lib/types';

function FormularioAreaUsuario() {
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

  if (!perfil) return null;

  const predioNome =
    perfil.role === 'USUARIO'
      ? (perfil as PerfilUsuario).predio?.nome
      : (perfil as PerfilFuncionarioOuGestor).predios?.map((p) => p.predio.nome).join(', ');

  return (
    <div className="stack">
      <h1>Área do usuário</h1>
      <div className="card">
        <p>
          <strong>E-mail:</strong> {perfil.email}
        </p>
        <p>
          <strong>Perfil:</strong> {perfil.role}
        </p>
        {predioNome && (
          <p>
            <strong>Prédio(s):</strong> {predioNome}
          </p>
        )}
        {perfil.role === 'FUNCIONARIO' && (perfil as PerfilFuncionarioOuGestor).area && (
          <p>
            <strong>Área de atuação:</strong> {(perfil as PerfilFuncionarioOuGestor).area}
          </p>
        )}
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nomeCompleto">Nome completo</label>
          <input
            id="nomeCompleto"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
          />
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
    </div>
  );
}

export default function AreaUsuarioPage() {
  return (
    <RequireAuth>
      <FormularioAreaUsuario />
    </RequireAuth>
  );
}
