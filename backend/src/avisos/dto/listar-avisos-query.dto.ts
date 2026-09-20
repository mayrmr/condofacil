import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListarAvisosQueryDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data?: Date;

  @IsOptional()
  @IsUUID()
  localizacaoId?: string;
}
