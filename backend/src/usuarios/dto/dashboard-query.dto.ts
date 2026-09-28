import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Prioridade, StatusOcorrencia } from '../../generated/prisma/enums.js';

export const VISOES_DASHBOARD = ['kanban', 'calendario', 'lista'] as const;

export type VisaoDashboard = (typeof VISOES_DASHBOARD)[number];

export class DashboardQueryDto {
  @IsIn(VISOES_DASHBOARD)
  view!: VisaoDashboard;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsUUID()
  blocoId?: string;

  @IsOptional()
  @IsUUID()
  responsavelFuncionarioId?: string;

  @IsOptional()
  @IsIn(Object.values(Prioridade))
  prioridade?: Prioridade;

  @IsOptional()
  @IsIn(Object.values(StatusOcorrencia))
  status?: StatusOcorrencia;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodoDias?: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
