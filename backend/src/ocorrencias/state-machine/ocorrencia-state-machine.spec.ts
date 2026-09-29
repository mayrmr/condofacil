import { describe, expect, it } from 'vitest';
import type { Role, StatusOcorrencia } from '../../generated/prisma/enums.js';
import { TransicaoInvalidaError, podeTransicionar, transicoesPermitidas, validarTransicao } from './ocorrencia-state-machine.js';

const STATUS_REAIS: StatusOcorrencia[] = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'AVALIACAO',
  'CANCELAMENTO',
];

describe('ocorrencia state machine', () => {
  describe('usuario (fluxo restrito)', () => {
    it('so pode excluir a partir de ABERTURA (antes da analise)', () => {
      expect(podeTransicionar('ABERTURA', 'EXCLUIDA', 'USUARIO')).toBe(true);
      expect(podeTransicionar('ANALISE', 'EXCLUIDA', 'USUARIO')).toBe(false);
      expect(podeTransicionar('ATENDIMENTO', 'EXCLUIDA', 'USUARIO')).toBe(false);
    });

    it('so pode avaliar a partir de resolvida ou cancelamento', () => {
      expect(transicoesPermitidas('RESOLVIDA', 'USUARIO')).toEqual(['AVALIACAO']);
      expect(transicoesPermitidas('CANCELAMENTO', 'USUARIO')).toEqual(['AVALIACAO']);
    });

    it('nao pode fazer nenhuma outra transicao de etapa', () => {
      for (const de of STATUS_REAIS) {
        for (const para of STATUS_REAIS) {
          if (de === para) continue;
          const permitido = (de === 'RESOLVIDA' || de === 'CANCELAMENTO') && para === 'AVALIACAO';
          expect(podeTransicionar(de, para, 'USUARIO')).toBe(permitido);
        }
      }
      expect(podeTransicionar('ABERTURA', 'EXCLUIDA', 'USUARIO')).toBe(true);
    });
  });

  describe('gestor e funcionario (override livre)', () => {
    const rolesLivres: Role[] = ['GESTOR', 'FUNCIONARIO'];

    it('podem mudar entre quaisquer duas etapas reais diferentes', () => {
      for (const role of rolesLivres) {
        for (const de of STATUS_REAIS) {
          for (const para of STATUS_REAIS) {
            if (de === para) continue;
            expect(podeTransicionar(de, para, role)).toBe(true);
            expect(() => validarTransicao(de, para, role)).not.toThrow();
          }
        }
      }
    });

    it('transicoesPermitidas lista todas as etapas reais exceto a atual', () => {
      for (const role of rolesLivres) {
        for (const de of STATUS_REAIS) {
          expect(transicoesPermitidas(de, role).sort()).toEqual(
            STATUS_REAIS.filter((s) => s !== de).sort(),
          );
        }
      }
    });

    it('nao podem mudar para a mesma etapa, nem envolver EXCLUIDA', () => {
      for (const role of rolesLivres) {
        expect(podeTransicionar('ANALISE', 'ANALISE', role)).toBe(false);
        expect(podeTransicionar('ABERTURA', 'EXCLUIDA', role)).toBe(false);
        expect(podeTransicionar('EXCLUIDA', 'ABERTURA', role)).toBe(false);
      }
    });
  });

  it('transicao invalida lanca TransicaoInvalidaError', () => {
    expect(() => validarTransicao('AVALIACAO', 'ABERTURA', 'USUARIO')).toThrow(TransicaoInvalidaError);
  });
});
