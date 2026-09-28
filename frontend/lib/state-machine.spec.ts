import { describe, expect, it } from 'vitest';
import { transicoesPermitidas } from './state-machine';

// Espelha a tabela de backend/src/ocorrencias/state-machine/ocorrencia-state-machine.ts
// (exceto as transicoes para AVALIACAO, que passam por um formulario proprio
// de avaliacao, nao pelo dropdown generico de "mudar status" — ver
// frontend/app/ocorrencias/[id]/page.tsx).
describe('transicoesPermitidas', () => {
  it('gestor pode mover uma ocorrencia aberta para analise ou cancelamento', () => {
    expect(transicoesPermitidas('ABERTURA', 'GESTOR')).toEqual(
      expect.arrayContaining(['ANALISE', 'CANCELAMENTO']),
    );
    expect(transicoesPermitidas('ABERTURA', 'GESTOR')).toHaveLength(2);
  });

  it('usuario so pode excluir a partir de abertura', () => {
    expect(transicoesPermitidas('ABERTURA', 'USUARIO')).toEqual(['EXCLUIDA']);
    expect(transicoesPermitidas('ANALISE', 'USUARIO')).toEqual([]);
  });

  it('so o gestor avanca ou cancela a partir de analise', () => {
    expect(transicoesPermitidas('ANALISE', 'GESTOR')).toEqual(
      expect.arrayContaining(['ATENDIMENTO', 'CANCELAMENTO']),
    );
    expect(transicoesPermitidas('ANALISE', 'FUNCIONARIO')).toEqual([]);
    expect(transicoesPermitidas('ANALISE', 'USUARIO')).toEqual([]);
  });

  it('so o funcionario avanca a partir de atendimento ou aguarda material', () => {
    expect(transicoesPermitidas('ATENDIMENTO', 'FUNCIONARIO')).toEqual(
      expect.arrayContaining(['AGUARDA_MATERIAL', 'RESOLVIDA']),
    );
    expect(transicoesPermitidas('AGUARDA_MATERIAL', 'FUNCIONARIO')).toEqual(['RESOLVIDA']);
    expect(transicoesPermitidas('ATENDIMENTO', 'GESTOR')).toEqual(['CANCELAMENTO']);
  });

  it('estados terminais (resolvida, cancelada, avaliada, excluida) nao tem saida', () => {
    for (const status of ['RESOLVIDA', 'CANCELAMENTO', 'AVALIACAO', 'EXCLUIDA'] as const) {
      for (const role of ['USUARIO', 'FUNCIONARIO', 'GESTOR'] as const) {
        expect(transicoesPermitidas(status, role)).toEqual([]);
      }
    }
  });
});
