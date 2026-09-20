import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarVisitanteDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsDateString()
  dataVisita!: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
