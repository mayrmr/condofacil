import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarAreaSocialDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
