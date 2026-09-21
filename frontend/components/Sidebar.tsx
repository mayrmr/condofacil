'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { SVGProps } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';
import {
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
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
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
  { href: '/dashboard', label: 'Dashboard', icon: IconGrid, roles: ['FUNCIONARIO', 'GESTOR'] },
  { href: '/predio/estrutura', label: 'Estrutura do prédio', icon: IconBuilding, roles: ['GESTOR'] },
  { href: '/gestor/convidar', label: 'Convidar', icon: IconUserPlus, roles: ['GESTOR'] },
  { href: '/area-usuario', label: 'Área do usuário', icon: IconUser },
];

// A barra inferior do celular so cabe ~5 itens (padrao de app mobile, igual
// ao mockup de referencia). O resto das secoes fica acessivel a partir da
// pagina "Área do usuário" (ver app/area-usuario/page.tsx).
export const ITENS_BOTTOM_NAV: Record<Role, string[]> = {
  USUARIO: ['/', '/avisos', '/financeiro', '/reservas', '/area-usuario'],
  FUNCIONARIO: ['/', '/avisos', '/dashboard', '/encomendas', '/area-usuario'],
  GESTOR: ['/', '/avisos', '/dashboard', '/financeiro', '/area-usuario'],
};

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export function itensParaPerfil(role?: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
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

  const itens = itensParaPerfil(perfil.role);
  const hrefsBottomNav = perfil.role ? ITENS_BOTTOM_NAV[perfil.role] : [];
  const itensBottomNav = hrefsBottomNav
    .map((href) => itens.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));

  function estaAtivo(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <IconBuilding style={{ width: 18, height: 18 }} />
          </span>
          CondoFácil
        </div>
        <nav>
          {itens.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={estaAtivo(item.href) ? 'active' : ''}>
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
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

      <div className="topbar-mobile">
        <span className="brand">CondoFácil</span>
      </div>

      <nav className="bottom-nav">
        {itensBottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={estaAtivo(item.href) ? 'active' : ''}>
              <Icon />
              <span>{item.href === '/area-usuario' ? 'Perfil' : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
