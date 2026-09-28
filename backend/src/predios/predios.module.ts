import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module.js';
import { PrediosController } from './predios.controller.js';
import { PrediosService } from './predios.service.js';

@Module({
  imports: [StorageModule],
  controllers: [PrediosController],
  providers: [PrediosService],
})
export class PrediosModule {}
