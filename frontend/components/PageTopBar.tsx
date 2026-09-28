import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconBell } from './icons';

export function PageTopBar({
  title,
  subtitulo,
  sino,
  children,
}: {
  title: string;
  subtitulo?: string;
  sino?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="page-topbar">
      <div>
        <h1>{title}</h1>
        {subtitulo && <p className="page-topbar-subtitulo">{subtitulo}</p>}
      </div>
      {(children || sino) && (
        <div className="page-topbar-acoes">
          {children}
          {sino && (
            <Link href="/avisos" className="page-topbar-sino" aria-label="Avisos">
              <IconBell />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
