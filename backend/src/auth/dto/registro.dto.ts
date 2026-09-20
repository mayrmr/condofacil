import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsUUID()
  apartamentoId?: string;
}
