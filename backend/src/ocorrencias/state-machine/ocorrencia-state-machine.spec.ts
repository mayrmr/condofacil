import { describe, expect, it } from 'vitest';
import type { Role, StatusOcorrencia } from '../../generated/prisma/enums.js';
import {
  TRANSICOES,
  TransicaoInvalidaError,
  podeTransicionar,
  transicoesPermitidas,
  validarTransicao,
} from './ocorrencia-state-machine.js';

const TODOS_STATUS: StatusOcorrencia[] = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'CANCELAMENTO',
  'AVALIACAO',
  'EXCLUIDA',
];

const TODOS_ROLES: Role[] = ['USUARIO', 'FUNCIONARIO', 'GESTOR'];

describe('ocorrencia state machine', () => {
  it.each(TRANSICOES.flatMap((t) => t.rolesPermitidas.map((role) => [t.de, t.para, role] as const)))(
    'permite %s -> %s para %s',
    (de, para, role) => {
      expect(podeTransicionar(de, para, role)).toBe(true);
      expect(() => validarTransicao(de, para, role)).not.toThrow();
    },
  );

  it('nega qualquer transicao para um perfil nao listado na tabela', () => {
    for (const de of TODOS_STATUS) {
      for (const para of TODOS_STATUS) {
        const transicao = TRANSICOES.find((t) => t.de === de && t.para === para);
        const rolesNaoPermitidos = TODOS_ROLES.filter(
          (role) => !transicao?.rolesPermitidas.includes(role),
        );

        for (const role of rolesNaoPermitidos) {
          expect(podeTransicionar(de, para, role)).toBe(false);
          expect(() => validarTransicao(de, para, role)).toThrow(TransicaoInvalidaError);
        }
      }
    }
  });

  it('nega transicoes que nao existem na tabela, para qualquer perfil', () => {
    const paresValidos = new Set(TRANSICOES.map((t) => `${t.de}->${t.para}`));

    for (const de of TODOS_STATUS) {
      for (const para of TODOS_STATUS) {
        if (paresValidos.has(`${de}->${para}`)) continue;

        for (const role of TODOS_ROLES) {
          expect(podeTransicionar(de, para, role)).toBe(false);
        }
      }
    }
  });

  it('usuario so pode excluir a partir de ABERTURA (antes da analise)', () => {
    expect(podeTransicionar('ABERTURA', 'EXCLUIDA', 'USUARIO')).toBe(true);
    expect(podeTransicionar('ANALISE', 'EXCLUIDA', 'USUARIO')).toBe(false);
    expect(podeTransicionar('ATENDIMENTO', 'EXCLUIDA', 'USUARIO')).toBe(false);
  });

  it('so o gestor cancela, a partir de abertura, analise, atendimento ou aguarda material', () => {
    for (const de of ['ABERTURA', 'ANALISE', 'ATENDIMENTO', 'AGUARDA_MATERIAL'] as StatusOcorrencia[]) {
      expect(podeTransicionar(de, 'CANCELAMENTO', 'GESTOR')).toBe(true);
      expect(podeTransicionar(de, 'CANCELAMENTO', 'FUNCIONARIO')).toBe(false);
      expect(podeTransicionar(de, 'CANCELAMENTO', 'USUARIO')).toBe(false);
    }
  });

  it('so o funcionario resolve, a partir de atendimento ou aguarda material', () => {
    for (const de of ['ATENDIMENTO', 'AGUARDA_MATERIAL'] as StatusOcorrencia[]) {
      expect(podeTransicionar(de, 'RESOLVIDA', 'FUNCIONARIO')).toBe(true);
      expect(podeTransicionar(de, 'RESOLVIDA', 'GESTOR')).toBe(false);
      expect(podeTransicionar(de, 'RESOLVIDA', 'USUARIO')).toBe(false);
    }
  });

  it('resolvida e cancelamento so avancam para avaliacao, e so pelo usuario', () => {
    expect(transicoesPermitidas('RESOLVIDA', 'USUARIO')).toEqual(['AVALIACAO']);
    expect(transicoesPermitidas('CANCELAMENTO', 'USUARIO')).toEqual(['AVALIACAO']);
    expect(transicoesPermitidas('RESOLVIDA', 'GESTOR')).toEqual([]);
    expect(transicoesPermitidas('RESOLVIDA', 'FUNCIONARIO')).toEqual([]);
  });

  it('avaliacao e excluida sao estados terminais (nenhuma transicao de saida)', () => {
    for (const role of TODOS_ROLES) {
      expect(transicoesPermitidas('AVALIACAO', role)).toEqual([]);
      expect(transicoesPermitidas('EXCLUIDA', role)).toEqual([]);
    }
  });
});
