'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { OcorrenciaCard } from '@/components/OcorrenciaCard';
import { OcorrenciaModal } from '@/components/OcorrenciaModal';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import type { Ocorrencia } from '@/lib/types';

function ListaMinhasOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<string | null>(null);

  const carregar = useCallback(() => {
    return api
      .get<Ocorrencia[]>('/ocorrencias?minhas=true')
      .then(setOcorrencias)
      .catch(() => setErro('Não foi possível carregar suas ocorrências.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <>
      <div className="row-between">
        <h1>Minhas ocorrências</h1>
        <Link href="/ocorrencias/nova" className="btn btn-primary">
          + Nova ocorrência
        </Link>
      </div>
      {carregando && <p className="muted">Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}
      {!carregando && !erro && ocorrencias.length === 0 && (
        <p className="muted">Você ainda não abriu nenhuma ocorrência.</p>
      )}
      <div className="stack">
        {ocorrencias.map((o) => (
          <OcorrenciaCard key={o.id} ocorrencia={o} aoAbrir={setOcorrenciaAbertaId} />
        ))}
      </div>
      {ocorrenciaAbertaId && (
        <OcorrenciaModal
          id={ocorrenciaAbertaId}
          aoFechar={() => setOcorrenciaAbertaId(null)}
          aoAlterar={carregar}
        />
      )}
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
