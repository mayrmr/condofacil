import { IsIn, IsInt, Max, Min } from 'class-validator';

export const TIPOS_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024; // 5MB

export class SolicitarUploadImagemDto {
  @IsIn(TIPOS_IMAGEM_PERMITIDOS)
  contentType!: (typeof TIPOS_IMAGEM_PERMITIDOS)[number];

  @IsInt()
  @Min(1)
  @Max(TAMANHO_MAXIMO_IMAGEM_BYTES)
  tamanhoBytes!: number;
}
