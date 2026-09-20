import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarFaturaDto } from './dto/criar-fatura.dto.js';
import { FinanceiroService } from './financeiro.service.js';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser) {
    return this.financeiroService.listar(user);
  }

  @Get(':id')
  buscarPorId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.financeiroService.buscarPorId(user, id);
  }

  @Roles(Role.GESTOR)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarFaturaDto) {
    return this.financeiroService.criar(user, dto);
  }

  @Roles(Role.USUARIO)
  @Patch(':id/pagar')
  pagar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.financeiroService.pagar(user, id);
  }
}
