import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CriarBlocoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  // Quando os dois vierem preenchidos, gera automaticamente um apartamento
  // por unidade (numeracao andar*100 + unidade, ex.: 101, 102, 201, 202).
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  andares?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  apartamentosPorAndar?: number;
}
