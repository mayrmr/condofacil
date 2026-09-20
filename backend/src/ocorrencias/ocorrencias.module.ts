import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { OcorrenciasController } from './ocorrencias.controller.js';
import { OcorrenciasService } from './ocorrencias.service.js';

@Module({
  imports: [NotificacoesModule, StorageModule],
  controllers: [OcorrenciasController],
  providers: [OcorrenciasService],
})
export class OcorrenciasModule {}
