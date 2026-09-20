import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarAreaReservavelDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
