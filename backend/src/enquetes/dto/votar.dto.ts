import { IsUUID } from 'class-validator';

export class VotarDto {
  @IsUUID()
  opcaoId!: string;
}
