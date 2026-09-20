import type { Role, StatusOcorrencia } from './types';

// Espelha backend/src/ocorrencias/state-machine/ocorrencia-state-machine.ts —
// so para decidir quais botoes mostrar na UI. A validacao de verdade
// acontece no backend; duplicar aqui e so uma conveniencia de UX.
const TRANSICOES: { de: StatusOcorrencia; para: StatusOcorrencia; rolesPermitidas: Role[] }[] = [
  { de: 'ABERTURA', para: 'ANALISE', rolesPermitidas: ['GESTOR'] },
  { de: 'ABERTURA', para: 'EXCLUIDA', rolesPermitidas: ['USUARIO'] },
  { de: 'ANALISE', para: 'ATENDIMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'ANALISE', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'ATENDIMENTO', para: 'AGUARDA_MATERIAL', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'ATENDIMENTO', para: 'RESOLVIDA', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'ATENDIMENTO', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
  { de: 'AGUARDA_MATERIAL', para: 'RESOLVIDA', rolesPermitidas: ['FUNCIONARIO'] },
  { de: 'AGUARDA_MATERIAL', para: 'CANCELAMENTO', rolesPermitidas: ['GESTOR'] },
];

export function transicoesPermitidas(de: StatusOcorrencia, role: Role): StatusOcorrencia[] {
  return TRANSICOES.filter((t) => t.de === de && t.rolesPermitidas.includes(role)).map((t) => t.para);
}
