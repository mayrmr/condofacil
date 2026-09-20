import { IsNotEmpty, IsString } from 'class-validator';

export class CriarAreaSocialDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
