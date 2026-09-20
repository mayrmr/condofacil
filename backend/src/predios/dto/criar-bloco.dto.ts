import { IsNotEmpty, IsString } from 'class-validator';

export class CriarBlocoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
