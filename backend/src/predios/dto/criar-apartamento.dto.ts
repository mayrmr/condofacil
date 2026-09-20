import { IsNotEmpty, IsString } from 'class-validator';

export class CriarApartamentoDto {
  @IsString()
  @IsNotEmpty()
  numero!: string;
}
