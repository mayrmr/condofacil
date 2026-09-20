import { IsUUID } from 'class-validator';

export class AtualizarResponsavelDto {
  @IsUUID()
  funcionarioId!: string;
}
