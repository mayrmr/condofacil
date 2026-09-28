import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
  @IsString()
  regras?: string;
}
