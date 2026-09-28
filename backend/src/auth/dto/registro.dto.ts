import { IsEmail, IsIn, IsString, IsUUID, MinLength } from 'class-validator';
import { TipoVinculo } from '../../generated/prisma/enums.js';

export class RegistroDto {
  @IsString()
  @MinLength(3)
  nomeCompleto!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsUUID()
  predioId!: string;

  @IsUUID()
  apartamentoId!: string;

  @IsIn(Object.values(TipoVinculo))
  tipoVinculo!: TipoVinculo;
}
