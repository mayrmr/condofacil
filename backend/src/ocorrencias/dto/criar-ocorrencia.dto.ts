import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { LocalizacaoTipo } from '../../generated/prisma/enums.js';

export class CriarOcorrenciaDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @IsEnum(LocalizacaoTipo)
  localizacaoTipo!: LocalizacaoTipo;

  @IsUUID()
  localizacaoId!: string;
}
