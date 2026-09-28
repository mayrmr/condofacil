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

// Mesmas 7 categorias usadas no formulario de nova ocorrencia e no filtro
// do quadro (valor salvo no banco continua sem acento/caixa baixa — isso e
// so o rotulo exibido).
export const LABEL_CATEGORIA: Record<string, string> = {
  iluminacao: 'Iluminação',
  equipamento: 'Equipamento',
  vazamento: 'Vazamento',
  acessibilidade: 'Acessibilidade',
  seguranca: 'Segurança',
  manutencao: 'Manutenção',
  outro: 'Outro',
};

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Cor do indicador de cada etapa do kanban — reaproveita a mesma paleta
// semantica das .badge-* (ver globals.css).
export const COR_STATUS: Record<StatusOcorrencia, string> = {
  ABERTURA: 'var(--muted)',
  ANALISE: 'var(--warning)',
  ATENDIMENTO: 'var(--primary)',
  AGUARDA_MATERIAL: 'var(--warning)',
  RESOLVIDA: 'var(--success)',
  CANCELAMENTO: 'var(--danger)',
  AVALIACAO: 'var(--success)',
  EXCLUIDA: 'var(--danger)',
};

export function tempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `há ${diffD} d`;
}
