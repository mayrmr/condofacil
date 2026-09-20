import { Injectable, Logger } from '@nestjs/common';
import type { OcorrenciaModel } from '../generated/prisma/models.js';

// Entrega em tempo real fica a cargo do Supabase Realtime (subscricao do
// frontend nas tabelas `ocorrencias`/`historico_status`/`comentarios`
// filtrada por predio_id, direto no Postgres) — o backend so precisa
// escrever a mudanca no banco para que a notificacao chegue aos clientes
// inscritos. Este servico centraliza os pontos de extensao para o dia em
// que quisermos push extra (e-mail, push notification) alem do Realtime.
@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  notificarMudancaStatus(ocorrencia: OcorrenciaModel): void {
    this.logger.debug(
      `Ocorrencia ${ocorrencia.id} mudou para ${ocorrencia.statusAtual} (predio ${ocorrencia.predioId}).`,
    );
  }

  notificarNovoComentario(ocorrenciaOuAvisoId: string): void {
    this.logger.debug(`Novo comentario em ${ocorrenciaOuAvisoId}.`);
  }
}
