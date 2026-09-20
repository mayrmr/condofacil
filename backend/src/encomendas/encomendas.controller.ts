import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarEncomendaDto } from './dto/criar-encomenda.dto.js';
import { EncomendasService } from './encomendas.service.js';

@Controller('encomendas')
export class EncomendasController {
  constructor(private readonly encomendasService: EncomendasService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser) {
    return this.encomendasService.listar(user);
  }

  @Roles(Role.FUNCIONARIO, Role.GESTOR)
  @Post()
  registrar(@CurrentUser() user: AuthUser, @Body() dto: CriarEncomendaDto) {
    return this.encomendasService.registrar(user, dto);
  }

  @Patch(':id/retirar')
  retirar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.encomendasService.retirar(user, id);
  }
}
