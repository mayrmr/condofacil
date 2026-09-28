import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TipoVinculo } from '../../generated/prisma/enums.js';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nomeCompleto?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  // So aplicavel a perfil Usuario (mudanca de apartamento dentro do mesmo predio).
  @IsOptional()
  @IsUUID()
  apartamentoId?: string;

  @IsOptional()
  @IsIn(Object.values(TipoVinculo))
  tipoVinculo?: TipoVinculo;
}
