import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarComentarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto!: string;
}
