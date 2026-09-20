import { Module } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service.js';

@Module({
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
