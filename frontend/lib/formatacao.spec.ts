import { describe, expect, it } from 'vitest';
import { COR_STATUS, LABEL_STATUS, tempoRelativo } from './formatacao';
import type { StatusOcorrencia } from './types';

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

describe('LABEL_STATUS', () => {
  it('tem um rotulo em portugues para todos os status possiveis', () => {
    for (const status of TODOS_STATUS) {
      expect(LABEL_STATUS[status]).toBeTruthy();
      expect(typeof LABEL_STATUS[status]).toBe('string');
    }
  });
});

describe('COR_STATUS', () => {
  it('tem uma cor (variavel CSS) definida para todos os status possiveis', () => {
    for (const status of TODOS_STATUS) {
      expect(COR_STATUS[status]).toMatch(/^var\(--/);
    }
  });
});

describe('tempoRelativo', () => {
  it('retorna "agora mesmo" para um instante muito recente', () => {
    expect(tempoRelativo(new Date().toISOString())).toBe('agora mesmo');
  });

  it('retorna minutos para menos de uma hora', () => {
    const ha30min = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(tempoRelativo(ha30min)).toBe('há 30 min');
  });

  it('retorna horas para menos de um dia', () => {
    const ha5h = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(ha5h)).toBe('há 5 h');
  });

  it('retorna dias para um dia ou mais', () => {
    const ha3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(tempoRelativo(ha3d)).toBe('há 3 d');
  });
});
