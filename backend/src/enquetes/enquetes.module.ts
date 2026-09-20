import { Module } from '@nestjs/common';
import { EnquetesController } from './enquetes.controller.js';
import { EnquetesService } from './enquetes.service.js';

@Module({
  controllers: [EnquetesController],
  providers: [EnquetesService],
})
export class EnquetesModule {}
