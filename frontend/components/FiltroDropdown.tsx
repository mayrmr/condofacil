'use client';

import { useEffect, useRef, useState } from 'react';
import { IconX } from './icons';

export interface OpcaoFiltro {
  valor: string;
  texto: string;
}

// Botao compacto que so mostra o nome do filtro (nao o valor escolhido) — ao
// clicar, abre uma lista pra selecionar. Mesmo padrao usado no quadro de
// Ocorrencias do gestor.
export function FiltroDropdown({
  label,
  valorSelecionado,
  ativo,
  opcoes,
  aoSelecionar,
  aoLimpar,
}: {
  label: string;
  valorSelecionado: string;
  ativo: boolean;
  opcoes: OpcaoFiltro[];
  aoSelecionar: (v: string) => void;
  aoLimpar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  return (
    <div className="filtro-dropdown" ref={ref}>
      <button
        type="button"
        className={`filtro-dropdown-toggle${ativo ? ' ativo' : ''}`}
        onClick={() => setAberto((a) => !a)}
      >
        {label}
        {ativo && aoLimpar && (
          <span
            className="filtro-limpar-um"
            role="button"
            tabIndex={0}
            aria-label={`Limpar filtro de ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              aoLimpar();
              setAberto(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                aoLimpar();
                setAberto(false);
              }
            }}
          >
            <IconX />
          </span>
        )}
      </button>
      {aberto && (
        <div className="filtro-dropdown-menu">
          {opcoes.map((o) => (
            <button
              key={o.valor}
              type="button"
              className={`filtro-opcao${o.valor === valorSelecionado ? ' selecionada' : ''}`}
              onClick={() => {
                aoSelecionar(o.valor);
                setAberto(false);
              }}
            >
              {o.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
