'use client';

import { useParams, useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { OcorrenciaDetalhe } from '@/components/OcorrenciaDetalhe';

function Conteudo() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return <OcorrenciaDetalhe id={id} aoExcluir={() => router.push('/')} />;
}

export default function OcorrenciaDetalhePage() {
  return (
    <RequireAuth>
      <Conteudo />
    </RequireAuth>
  );
}
