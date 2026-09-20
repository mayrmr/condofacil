import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarEncomendaDto {
  @IsUUID()
  usuarioId!: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
