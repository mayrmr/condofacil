import type { Role, StatusOcorrencia } from './types';

// Espelha backend/src/ocorrencias/state-machine/ocorrencia-state-machine.ts —
// so para decidir quais botoes mostrar na UI. A validacao de verdade
// acontece no backend; duplicar aqui e so uma conveniencia de UX.
const TRANSICOES: { de: StatusOcorrencia; para: StatusOcorrencia; rolesPermitidas: Role[] }[] = [
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
];

// Etapas reais do fluxo (fora EXCLUIDA — cancelamento do proprio
// solicitante antes de analise, nao uma etapa de trabalho).
const STATUS_REAIS: StatusOcorrencia[] = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'AVALIACAO',
  'CANCELAMENTO',
];

function podeMudarLivremente(role: Role): boolean {
  return role === 'GESTOR' || role === 'FUNCIONARIO';
}

export function transicoesPermitidas(de: StatusOcorrencia, role: Role): StatusOcorrencia[] {
  if (podeMudarLivremente(role)) {
    return STATUS_REAIS.filter((s) => s !== de);
  }
  return TRANSICOES.filter((t) => t.de === de && t.rolesPermitidas.includes(role)).map((t) => t.para);
}
