import { Module } from '@nestjs/common';
import { PrediosController } from './predios.controller.js';
import { PrediosService } from './predios.service.js';

@Module({
  controllers: [PrediosController],
  providers: [PrediosService],
})
export class PrediosModule {}
