'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function NavBar() {
  const { perfil, session, sair } = useAuth();
  const router = useRouter();

  async function handleSair() {
    await sair();
    router.push('/login');
  }

  return (
    <nav className="navbar">
      <div className="inner">
        <Link href="/" className="brand">
          Plataforma de Chamados
        </Link>
        {session && perfil && (
          <>
            <div className="links">
              <Link href="/">Feed</Link>
              <Link href="/minhas-ocorrencias">Minhas ocorrências</Link>
              <Link href="/avisos">Avisos</Link>
              {(perfil.role === 'FUNCIONARIO' || perfil.role === 'GESTOR') && (
                <Link href="/dashboard">Dashboard</Link>
              )}
              <Link href="/area-usuario">Área do usuário</Link>
            </div>
            <span className="muted">{perfil.nomeCompleto}</span>
            <button onClick={handleSair}>Sair</button>
          </>
        )}
        {!session && (
          <div className="links" style={{ justifyContent: 'flex-end' }}>
            <Link href="/login">Entrar</Link>
            <Link href="/registro">Criar conta</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
