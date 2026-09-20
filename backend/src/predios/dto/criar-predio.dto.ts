import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CriarPredioDto {
  @IsUUID()
  empresaId!: string;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  endereco!: string;
}
