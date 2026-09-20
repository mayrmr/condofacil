import { Module } from '@nestjs/common';
import { VisitantesController } from './visitantes.controller.js';
import { VisitantesService } from './visitantes.service.js';

@Module({
  controllers: [VisitantesController],
  providers: [VisitantesService],
})
export class VisitantesModule {}
