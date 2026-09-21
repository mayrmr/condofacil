import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';
import { DestinatarioAviso, LocalizacaoTipoAviso } from '../../generated/prisma/enums.js';

export class CriarAvisoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @IsEnum(LocalizacaoTipoAviso)
  localizacaoTipo!: LocalizacaoTipoAviso;

  // Obrigatorio para AREA_SOCIAL/BLOCO; ausente quando localizacaoTipo e GERAL.
  @ValidateIf((dto: CriarAvisoDto) => dto.localizacaoTipo !== LocalizacaoTipoAviso.GERAL)
  @IsUUID()
  localizacaoId?: string;

  @IsEnum(DestinatarioAviso)
  destinatarioTipo!: DestinatarioAviso;

  // Obrigatorio quando destinatarioTipo e BLOCO.
  @ValidateIf((dto: CriarAvisoDto) => dto.destinatarioTipo === DestinatarioAviso.BLOCO)
  @IsUUID()
  destinatarioBlocoId?: string;
}
