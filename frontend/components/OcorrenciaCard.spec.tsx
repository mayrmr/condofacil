import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OcorrenciaCard } from './OcorrenciaCard';
import type { Ocorrencia } from '@/lib/types';

function criarOcorrencia(sobrescritas: Partial<Ocorrencia> = {}): Ocorrencia {
  return {
    id: 'ocorrencia-1',
    predioId: 'predio-1',
    criadoPorUsuarioId: 'usuario-1',
    responsavelFuncionarioId: null,
    gestorAnaliseId: null,
    titulo: 'Vazamento no corredor',
    descricao: 'Há um vazamento de água no corredor do térreo.',
    categoria: 'vazamento',
    localizacaoTipo: 'AREA_SOCIAL',
    localizacaoId: 'area-1',
    prioridade: null,
    statusAtual: 'ABERTURA',
    solucaoAplicada: null,
    observacoesGestao: null,
    observacoesFuncionario: null,
    avaliacaoNota: null,
    avaliacaoComentario: null,
    criadoEm: '2026-01-01T10:00:00.000Z',
    ...sobrescritas,
  };
}

describe('OcorrenciaCard', () => {
  it('mostra titulo, categoria e o rotulo do status atual', () => {
    render(<OcorrenciaCard ocorrencia={criarOcorrencia()} />);

    expect(screen.getByText('Vazamento no corredor')).toBeInTheDocument();
    expect(screen.getByText('Aberta')).toBeInTheDocument();
    expect(screen.getByText(/vazamento/)).toBeInTheDocument();
  });

  it('mostra a prioridade quando ela esta definida', () => {
    render(<OcorrenciaCard ocorrencia={criarOcorrencia({ prioridade: 'URGENTE' })} />);

    expect(screen.getByText(/Prioridade urgente/)).toBeInTheDocument();
  });

  it('nao mostra prioridade quando ela e nula', () => {
    render(<OcorrenciaCard ocorrencia={criarOcorrencia({ prioridade: null })} />);

    expect(screen.queryByText(/Prioridade/)).not.toBeInTheDocument();
  });

  it('linka para a pagina de detalhe da ocorrencia', () => {
    render(<OcorrenciaCard ocorrencia={criarOcorrencia()} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/ocorrencias/ocorrencia-1');
  });
});
