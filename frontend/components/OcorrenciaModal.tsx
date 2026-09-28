'use client';

import { useEffect } from 'react';
import { IconX } from './icons';
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe';

export function OcorrenciaModal({
  id,
  aoFechar,
  aoAlterar,
}: {
  id: string;
  aoFechar: () => void;
  aoAlterar?: () => void;
}) {
  useEffect(() => {
    function aoTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTecla);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTecla);
      document.body.style.overflow = '';
    };
  }, [aoFechar]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="modal-painel">
        <button type="button" className="modal-fechar" onClick={aoFechar} aria-label="Fechar">
          <IconX />
        </button>
        <div className="modal-conteudo">
          <OcorrenciaDetalhe id={id} aoAlterar={aoAlterar} aoExcluir={aoFechar} />
        </div>
      </div>
    </div>
  );
}
