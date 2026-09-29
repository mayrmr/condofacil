import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CriarAreaSocialDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidadeMaxima?: number;

  @IsOptional()
  @IsString()
  horarioFuncionamento?: string;

  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'horarioAbertura deve estar no formato HH:mm.' })
  horarioAbertura?: string;

  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'horarioFechamento deve estar no formato HH:mm.' })
  horarioFechamento?: string;

  @IsOptional()
  @IsString()
  regras?: string;
}
