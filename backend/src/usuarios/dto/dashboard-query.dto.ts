import { IsIn } from 'class-validator';

export const VISOES_DASHBOARD = [
  'kanban',
  'calendario',
  'lista',
  'prioridades',
  'funcionarios',
  'areas',
] as const;

export type VisaoDashboard = (typeof VISOES_DASHBOARD)[number];

export class DashboardQueryDto {
  @IsIn(VISOES_DASHBOARD)
  view!: VisaoDashboard;
}
