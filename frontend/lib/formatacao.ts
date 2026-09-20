import type { StatusOcorrencia } from './types';

export const LABEL_STATUS: Record<StatusOcorrencia, string> = {
  ABERTURA: 'Aberta',
  ANALISE: 'Em análise',
  ATENDIMENTO: 'Em atendimento',
  AGUARDA_MATERIAL: 'Aguardando material',
  RESOLVIDA: 'Resolvida',
  CANCELAMENTO: 'Cancelada',
  AVALIACAO: 'Avaliada',
  EXCLUIDA: 'Excluída',
};

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
