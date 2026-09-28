import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AtualizarAreaSocialDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidadeMaxima?: number;

  @IsOptional()
  @IsString()
  horarioFuncionamento?: string;

  @IsOptional()
  @IsString()
  regras?: string;
}
