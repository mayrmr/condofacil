import { ArrayMinSize, IsArray, IsEmail, IsIn, IsString, IsUUID, ValidateIf } from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

// Convite so existe para Funcionario e Gestor — Usuario e sempre auto-cadastro.
const ROLES_CONVITAVEIS = [Role.FUNCIONARIO, Role.GESTOR] as const;

export class ConviteDto {
  @IsEmail()
  email!: string;

  @IsIn(ROLES_CONVITAVEIS)
  role!: (typeof ROLES_CONVITAVEIS)[number];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  predioIds!: string[];

  @ValidateIf((dto: ConviteDto) => dto.role === Role.FUNCIONARIO)
  @IsString()
  area?: string;
}
