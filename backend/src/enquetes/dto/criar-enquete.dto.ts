import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarEnqueteDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  opcoes!: string[];
}
