import { Module } from '@nestjs/common';
import { EncomendasController } from './encomendas.controller.js';
import { EncomendasService } from './encomendas.service.js';

@Module({
  controllers: [EncomendasController],
  providers: [EncomendasService],
})
export class EncomendasModule {}
