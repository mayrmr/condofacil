import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module.js';
import { ReservasController } from './reservas.controller.js';
import { ReservasService } from './reservas.service.js';

@Module({
  imports: [StorageModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
