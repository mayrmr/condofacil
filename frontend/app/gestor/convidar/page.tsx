'use client';

import { useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PerfilFuncionarioOuGestor, Role } from '@/lib/types';

function FormularioConvite() {
  const { perfil } = useAuth();
  const predioIds = (perfil as PerfilFuncionarioOuGestor | null)?.predios?.map((p) => p.predio.id) ?? [];

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Extract<Role, 'FUNCIONARIO' | 'GESTOR'>>('FUNCIONARIO');
  const [area, setArea] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ token: string; expiraEm: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setResultado(null);
    try {
      const criado = await api.post<{ token: string; expiraEm: string }>('/auth/convite', {
        email,
        role,
        predioIds,
        ...(role === 'FUNCIONARIO' ? { area } : {}),
      });
      setResultado(criado);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar o convite.');
    }
  }

  const linkConvite = resultado
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aceitar-convite/${resultado.token}`
    : null;

  return (
    <div className="stack">
      <h1>Convidar funcionário ou gestor</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">E-mail do convidado</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="role">Perfil</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="FUNCIONARIO">Funcionário</option>
            <option value="GESTOR">Gestor</option>
          </select>
        </div>
        {role === 'FUNCIONARIO' && (
          <div className="field">
            <label htmlFor="area">Área de atuação</label>
            <input
              id="area"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ex: Manutenção, Portaria, Limpeza"
            />
          </div>
        )}
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn-primary">
          Gerar convite
        </button>
      </form>

      {resultado && linkConvite && (
        <div className="card">
          <h2>Convite criado!</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Compartilhe este link com {email} (válido até{' '}
            {new Date(resultado.expiraEm).toLocaleDateString('pt-BR')}):
          </p>
          <p>
            <code>{linkConvite}</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ConvidarPage() {
  return (
    <RequireAuth papeis={['GESTOR']}>
      <FormularioConvite />
    </RequireAuth>
  );
}
