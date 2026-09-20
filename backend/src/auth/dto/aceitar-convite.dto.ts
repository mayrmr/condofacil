import { IsOptional, IsString, MinLength } from 'class-validator';

export class AceitarConviteDto {
  @IsString()
  @MinLength(3)
  nomeCompleto!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
