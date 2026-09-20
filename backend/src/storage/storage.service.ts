import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

export const BUCKET_OCORRENCIAS = 'ocorrencias';

// URLs de imagem nunca sao publicas permanentemente (secao 11): todo acesso
// de leitura passa por uma signed URL com expiracao curta, gerada sob
// demanda ao montar a resposta da API — nunca armazenamos/expomos uma URL
// publica direta do bucket.
@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async criarUploadAssinado(path: string): Promise<{ path: string; token: string; signedUrl: string }> {
    const { data, error } = await this.supabase.admin.storage
      .from(BUCKET_OCORRENCIAS)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException('Falha ao gerar URL de upload.');
    }

    return { path: data.path, token: data.token, signedUrl: data.signedUrl };
  }

  async criarUrlLeitura(path: string, expiresInSeconds = 60 * 10): Promise<string> {
    const { data, error } = await this.supabase.admin.storage
      .from(BUCKET_OCORRENCIAS)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      throw new InternalServerErrorException('Falha ao gerar URL de leitura.');
    }

    return data.signedUrl;
  }
}
