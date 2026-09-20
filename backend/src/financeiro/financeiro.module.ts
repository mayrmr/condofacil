import { Module } from '@nestjs/common';
import { FinanceiroController } from './financeiro.controller.js';
import { FinanceiroService } from './financeiro.service.js';

@Module({
  controllers: [FinanceiroController],
  providers: [FinanceiroService],
})
export class FinanceiroModule {}
