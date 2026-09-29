import { IsBoolean } from 'class-validator';

export class BloqueioDto {
  @IsBoolean()
  ativo!: boolean;
}
