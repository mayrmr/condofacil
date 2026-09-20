import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarEnqueteDto } from './dto/criar-enquete.dto.js';
import { VotarDto } from './dto/votar.dto.js';
import { EnquetesService } from './enquetes.service.js';

@Controller('enquetes')
export class EnquetesController {
  constructor(private readonly enquetesService: EnquetesService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser) {
    return this.enquetesService.listar(user);
  }

  @Get(':id')
  buscarPorId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.enquetesService.buscarPorId(user, id);
  }

  @Roles(Role.GESTOR)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarEnqueteDto) {
    return this.enquetesService.criar(user, dto);
  }

  @Post(':id/votar')
  votar(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: VotarDto) {
    return this.enquetesService.votar(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Patch(':id/encerrar')
  encerrar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.enquetesService.encerrar(user, id);
  }
}
