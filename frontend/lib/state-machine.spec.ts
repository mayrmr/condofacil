import { describe, expect, it } from 'vitest';
import { transicoesPermitidas } from './state-machine';

const STATUS_REAIS = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'AVALIACAO',
  'CANCELAMENTO',
] as const;

// Espelha backend/src/ocorrencias/state-machine/ocorrencia-state-machine.ts:
// gestor e funcionario podem mudar livremente entre quaisquer etapas reais
// (exceto AVALIACAO, que passa por um formulario proprio, e EXCLUIDA, que so
// o proprio solicitante faz a partir de ABERTURA).
describe('transicoesPermitidas', () => {
  it('gestor e funcionario podem mudar para qualquer etapa real, exceto a atual', () => {
    for (const role of ['GESTOR', 'FUNCIONARIO'] as const) {
      for (const de of STATUS_REAIS) {
        expect(transicoesPermitidas(de, role).sort()).toEqual(
          STATUS_REAIS.filter((s) => s !== de).sort(),
        );
      }
    }
  });

  it('usuario so pode excluir a partir de abertura', () => {
    expect(transicoesPermitidas('ABERTURA', 'USUARIO')).toEqual(['EXCLUIDA']);
    expect(transicoesPermitidas('ANALISE', 'USUARIO')).toEqual([]);
  });

  it('usuario nao tem a opcao livre de mudar de etapa', () => {
    for (const de of STATUS_REAIS) {
      if (de === 'ABERTURA') continue;
      expect(transicoesPermitidas(de, 'USUARIO')).toEqual([]);
    }
  });
});
