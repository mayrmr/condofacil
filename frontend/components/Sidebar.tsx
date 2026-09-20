'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';
import {
  IconBarChart,
  IconBell,
  IconBuilding,
  IconCalendar,
  IconClipboard,
  IconCreditCard,
  IconGrid,
  IconHome,
  IconLogOut,
  IconPackage,
  IconUser,
  IconUserPlus,
  IconUsers,
} from './icons';

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Início', icon: IconHome },
  { href: '/minhas-ocorrencias', label: 'Minhas ocorrências', icon: IconClipboard, roles: ['USUARIO'] },
  { href: '/avisos', label: 'Avisos', icon: IconBell },
  { href: '/financeiro', label: 'Financeiro', icon: IconCreditCard, roles: ['USUARIO', 'GESTOR'] },
  { href: '/reservas', label: 'Reservas', icon: IconCalendar },
  { href: '/visitantes', label: 'Visitantes', icon: IconUsers, roles: ['USUARIO'] },
  { href: '/encomendas', label: 'Encomendas', icon: IconPackage },
  { href: '/enquetes', label: 'Enquetes', icon: IconBarChart },
  { href: '/dashboard', label: 'Dashboard', icon: IconGrid, roles: ['FUNCIONARIO', 'GESTOR'] },
  { href: '/predio/estrutura', label: 'Estrutura do prédio', icon: IconBuilding, roles: ['GESTOR'] },
  { href: '/gestor/convidar', label: 'Convidar', icon: IconUserPlus, roles: ['GESTOR'] },
  { href: '/area-usuario', label: 'Área do usuário', icon: IconUser },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export function Sidebar() {
  const { perfil, session, sair } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSair() {
    await sair();
    router.push('/login');
  }

  if (!session || !perfil) {
    return null;
  }

  const itens = NAV_ITEMS.filter((item) => !item.roles || (perfil.role && item.roles.includes(perfil.role)));

  const nav = (
    <>
      {itens.map((item) => {
        const Icon = item.icon;
        const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={ativo ? 'active' : ''}>
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <IconBuilding style={{ width: 18, height: 18 }} />
          </span>
          Plataforma de Chamados
        </div>
        <nav>{nav}</nav>
        <div className="sidebar-footer">
          <span className="avatar">{iniciais(perfil.nomeCompleto)}</span>
          <div className="who">
            <strong>{perfil.nomeCompleto}</strong>
            <span>{perfil.role}</span>
          </div>
          <button onClick={handleSair} title="Sair" aria-label="Sair">
            <IconLogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </aside>

      <div className="topbar">
        <span className="brand">Chamados</span>
        <nav>
          {itens.map((item) => {
            const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={ativo ? 'active' : ''}>
                {item.label}
              </Link>
            );
          })}
          <button onClick={handleSair}>Sair</button>
        </nav>
      </div>
    </>
  );
}
