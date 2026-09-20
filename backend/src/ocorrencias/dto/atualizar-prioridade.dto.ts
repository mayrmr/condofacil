import { IsEnum } from 'class-validator';
import { Prioridade } from '../../generated/prisma/enums.js';

export class AtualizarPrioridadeDto {
  @IsEnum(Prioridade)
  prioridade!: Prioridade;
}
