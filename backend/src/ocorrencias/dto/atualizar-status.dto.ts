import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusOcorrencia } from '../../generated/prisma/enums.js';

export class AtualizarStatusDto {
  @IsEnum(StatusOcorrencia)
  status!: StatusOcorrencia;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;

  // Preenchido pelo funcionario ao mover para RESOLVIDA.
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  solucaoAplicada?: string;
}
