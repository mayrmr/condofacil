import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Prioridade, StatusOcorrencia } from '../../generated/prisma/enums.js';

export class ListarOcorrenciasQueryDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data?: Date;

  @IsOptional()
  @IsUUID()
  localizacaoId?: string;

  @IsOptional()
  @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @IsOptional()
  @IsEnum(StatusOcorrencia)
  status?: StatusOcorrencia;
}
