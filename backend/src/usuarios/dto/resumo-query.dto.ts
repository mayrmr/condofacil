import { IsIn, IsOptional } from 'class-validator';

export const PERIODOS_RESUMO = ['mes', 'trimestre', 'ano'] as const;
export type PeriodoResumo = (typeof PERIODOS_RESUMO)[number];

export class ResumoQueryDto {
  @IsOptional()
  @IsIn(PERIODOS_RESUMO)
  periodo?: PeriodoResumo;
}
