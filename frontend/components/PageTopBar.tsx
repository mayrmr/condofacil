import type { ReactNode } from 'react';

export function PageTopBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-topbar">
      <h1>{title}</h1>
      {children && <div className="page-topbar-acoes">{children}</div>}
    </div>
  );
}
