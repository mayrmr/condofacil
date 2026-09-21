'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

// Link curto de convite (compartilhado pelo gestor na aba Convidar) que
// resolve o codigo em um predio e encaminha para o cadastro ja pre-preenchido.
export default function LinkConviteMoradorPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<{ id: string; nome: string }>(`/predios/codigo/${codigo}`)
      .then((predio) => {
        if (cancelado) return;
        router.replace(`/registro?predioId=${predio.id}&nomePredio=${encodeURIComponent(predio.nome)}`);
      })
      .catch((err) => {
        if (cancelado) return;
        setErro(err instanceof ApiError ? err.message : 'Link de convite inválido ou expirado.');
      });
    return () => {
      cancelado = true;
    };
  }, [codigo, router]);

  if (erro) {
    return (
      <div className="stack page-transition" style={{ maxWidth: 400, margin: '40px auto' }}>
        <h1>Link inválido</h1>
        <p className="erro">{erro}</p>
      </div>
    );
  }

  return (
    <div className="stack page-transition" style={{ maxWidth: 400, margin: '40px auto' }}>
      <p className="muted">Carregando...</p>
    </div>
  );
}
