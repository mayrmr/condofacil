'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Renderizado via portal direto em document.body: `.page-transition`
  // (o wrapper que RequireAuth poe em toda pagina, ver Sidebar/RequireAuth)
  // tem uma animacao que termina em transform: translateY(0) — qualquer
  // transform diferente de "none" num ancestral vira o containing block de
  // descendentes position:fixed. Sem o portal, o overlay ficava "preso"
  // dentro da altura real do conteudo da pagina (curta) em vez de cobrir a
  // viewport inteira, cortando o modal.
  return createPortal(
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
    </div>,
    document.body,
  );
}
