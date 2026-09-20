import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AvaliarOcorrenciaDto {
  @IsInt()
  @Min(1)
  @Max(5)
  nota!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comentario?: string;
}
