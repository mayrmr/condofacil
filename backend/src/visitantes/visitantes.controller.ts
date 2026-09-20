import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarVisitanteDto } from './dto/criar-visitante.dto.js';
import { VisitantesService } from './visitantes.service.js';

@Controller('visitantes')
export class VisitantesController {
  constructor(private readonly visitantesService: VisitantesService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser) {
    return this.visitantesService.listar(user);
  }

  @Roles(Role.USUARIO)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarVisitanteDto) {
    return this.visitantesService.criar(user, dto);
  }

  @Delete(':id')
  remover(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visitantesService.remover(user, id);
  }
}
