import Link from 'next/link';
import type { MouseEvent } from 'react';
import { formatarData, LABEL_STATUS } from '@/lib/formatacao';
import type { Ocorrencia } from '@/lib/types';

export function OcorrenciaCard({
  ocorrencia,
  aoAbrir,
}: {
  ocorrencia: Ocorrencia;
  /** Quando informado, intercepta o clique (abrir como modal) em vez de navegar para a rota de detalhe. */
  aoAbrir?: (id: string) => void;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!aoAbrir) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    aoAbrir(ocorrencia.id);
  }

  return (
    <Link href={`/ocorrencias/${ocorrencia.id}`} className="card" onClick={handleClick}>
      <div className="row-between">
        <strong>{ocorrencia.titulo}</strong>
        <span className={`badge badge-${ocorrencia.statusAtual}`}>{LABEL_STATUS[ocorrencia.statusAtual]}</span>
      </div>
      <p className="muted" style={{ marginTop: 6 }}>
        {ocorrencia.categoria} · {formatarData(ocorrencia.criadoEm)}
        {ocorrencia.prioridade ? ` · Prioridade ${ocorrencia.prioridade.toLowerCase()}` : ''}
      </p>
    </Link>
  );
}
