import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { AvisosController } from './avisos.controller.js';
import { AvisosService } from './avisos.service.js';

@Module({
  imports: [NotificacoesModule, StorageModule],
  controllers: [AvisosController],
  providers: [AvisosService],
})
export class AvisosModule {}
