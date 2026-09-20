import { IsDateString, IsMilitaryTime, IsUUID } from 'class-validator';

export class CriarReservaDto {
  @IsUUID()
  areaId!: string;

  @IsDateString()
  data!: string;

  @IsMilitaryTime()
  horaInicio!: string;

  @IsMilitaryTime()
  horaFim!: string;
}
