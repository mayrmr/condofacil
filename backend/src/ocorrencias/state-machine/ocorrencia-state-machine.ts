import type { Role, StatusOcorrencia } from '../../generated/prisma/enums.js';

export interface Transicao {
  de: StatusOcorrencia;
  para: StatusOcorrencia;
  rolesPermitidas: Role[];
}

// Maquina de estados da ocorrencia (secao 6 da especificacao). Fonte de
// verdade unica das transicoes permitidas — nunca validar status com
// if/else espalhado pelos services. Qualquer alteracao de fluxo de negocio
// (novo estado, nova transicao) deve mudar so esta tabela.
export const TRANSICOES: readonly Transicao[] = [
  { de: 'ABERTURA', para: 'ANALISE', rolesPermitidas: ['GESTOR'] },
  { de: 'ABERTURA', para: 'EXCLUIDA', rolesPermitidas: ['USUARIO'] },
  { de: 'ABERTURA', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'ANALISE', para: 'ATENDIMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'ANALISE', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'ATENDIMENTO', para: 'AGUARDA_MATERIAL', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'ATENDIMENTO', para: 'RESOLVIDA', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'ATENDIMENTO', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'AGUARDA_MATERIAL', para: 'RESOLVIDA', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'AGUARDA_MATERIAL', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'RESOLVIDA', para: 'AVALIACAO', rolesPermitidas: ['USUARIO'] },
  { de: 'CANCELAMENTO', para: 'AVALIACAO', rolesPermitidas: ['USUARIO'] },
] as const;

export class TransicaoInvalidaError extends Error {
  constructor(
    readonly de: StatusOcorrencia,
    readonly para: StatusOcorrencia,
    readonly role: Role,
  ) {
    super(`Transicao de "${de}" para "${para}" nao e permitida para o perfil ${role}.`);
    this.name = 'TransicaoInvalidaError';
  }
}

export function encontrarTransicao(
  de: StatusOcorrencia,
  para: StatusOcorrencia,
): Transicao | undefined {
  return TRANSICOES.find((t) => t.de === de && t.para === para);
}

export function podeTransicionar(de: StatusOcorrencia, para: StatusOcorrencia, role: Role): boolean {
  const transicao = encontrarTransicao(de, para);
  return transicao !== undefined && transicao.rolesPermitidas.includes(role);
}

// Lanca TransicaoInvalidaError se a transicao nao existir ou o role nao
// tiver permissao; usada pelos services antes de qualquer update de status.
export function validarTransicao(de: StatusOcorrencia, para: StatusOcorrencia, role: Role): void {
  if (!podeTransicionar(de, para, role)) {
    throw new TransicaoInvalidaError(de, para, role);
  }
}

export function transicoesPermitidas(de: StatusOcorrencia, role: Role): StatusOcorrencia[] {
  return TRANSICOES.filter((t) => t.de === de && t.rolesPermitidas.includes(role)).map((t) => t.para);
}
