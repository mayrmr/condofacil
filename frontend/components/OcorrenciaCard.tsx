import Link from 'next/link';
import { formatarData, LABEL_STATUS } from '@/lib/formatacao';
import type { Ocorrencia } from '@/lib/types';

export function OcorrenciaCard({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  return (
    <Link href={`/ocorrencias/${ocorrencia.id}`} className="card">
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
