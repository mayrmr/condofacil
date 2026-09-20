import { IsDateString, IsInt, IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';

export class CriarFaturaDto {
  @IsUUID()
  usuarioId!: string;

  @IsString()
  @IsNotEmpty()
  competencia!: string;

  @IsInt()
  @IsPositive()
  valorCentavos!: number;

  @IsDateString()
  vencimento!: string;
}
