'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import type { Ocorrencia } from '@/lib/types';

function ListaMinhasOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get<Ocorrencia[]>('/ocorrencias?minhas=true')
      .then(setOcorrencias)
      .finally(() => setCarregando(false));
  }, []);

  return (
    <>
      <div className="row-between">
        <h1>Minhas ocorrências</h1>
        <Link href="/ocorrencias/nova" className="btn btn-primary">
          + Nova ocorrência
        </Link>
      </div>
      {carregando && <p className="muted">Carregando...</p>}
      {!carregando && ocorrencias.length === 0 && (
        <p className="muted">Você ainda não abriu nenhuma ocorrência.</p>
      )}
      <div className="stack">
        {ocorrencias.map((o) => (
          <OcorrenciaCard key={o.id} ocorrencia={o} />
        ))}
      </div>
    </>
  );
}

export default function MinhasOcorrenciasPage() {
  return (
    <RequireAuth papeis={['USUARIO']}>
      <ListaMinhasOcorrencias />
    </RequireAuth>
  );
}
