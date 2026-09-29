import { IsNotEmpty, IsString } from 'class-validator';

export class AtualizarBlocoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
