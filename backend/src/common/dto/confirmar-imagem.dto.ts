import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmarImagemDto {
  // Caminho no bucket do Supabase Storage retornado por
  // POST .../imagens/solicitar-upload, apos o cliente ter concluido o
  // upload usando a signed URL.
  @IsString()
  @IsNotEmpty()
  path!: string;
}
