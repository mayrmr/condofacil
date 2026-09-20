import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusAviso } from '../../generated/prisma/enums.js';

export class AtualizarAvisoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsEnum(StatusAviso)
  status?: StatusAviso;
}
