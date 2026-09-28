import { describe, expect, it } from 'vitest';
import { iniciais, itensParaPerfil } from './Sidebar';

describe('iniciais', () => {
  it('junta a primeira letra do primeiro e do ultimo nome, em maiusculo', () => {
    expect(iniciais('Maria Souza')).toBe('MS');
    expect(iniciais('joão da silva')).toBe('JS');
  });

  it('usa so a primeira letra quando ha apenas um nome', () => {
    expect(iniciais('Maria')).toBe('M');
  });

  it('ignora espacos extras nas pontas', () => {
    expect(iniciais('  Ana Paula  ')).toBe('AP');
  });
});

describe('itensParaPerfil', () => {
  it('gestor ve os itens sem restricao de role e os restritos a gestor', () => {
    const itens = itensParaPerfil('GESTOR');
    const hrefs = itens.map((i) => i.href);
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/gestor/convidar');
    expect(hrefs).not.toContain('/minhas-ocorrencias');
  });

  it('usuario nao ve itens restritos a gestor ou funcionario', () => {
    const hrefs = itensParaPerfil('USUARIO').map((i) => i.href);
    expect(hrefs).toContain('/minhas-ocorrencias');
    expect(hrefs).not.toContain('/gestor/convidar');
    expect(hrefs).not.toContain('/dashboard');
  });

  it('sem perfil definido, so mostra os itens sem restricao de role', () => {
    const itens = itensParaPerfil(undefined);
    expect(itens.every((i) => !i.roles)).toBe(true);
  });
});
