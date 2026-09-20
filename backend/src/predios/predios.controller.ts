import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarPredioDto } from './dto/criar-predio.dto.js';
import { PrediosService } from './predios.service.js';

@Controller('predios')
export class PrediosController {
  constructor(private readonly prediosService: PrediosService) {}

  @Get(':id')
  buscarPorId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prediosService.buscarPorId(user, id);
  }

  @Get(':id/blocos')
  blocos(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prediosService.blocos(user, id);
  }

  @Get(':id/areas-sociais')
  areasSociais(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prediosService.areasSociais(user, id);
  }

  @Roles(Role.GESTOR)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarPredioDto) {
    return this.prediosService.criar(user.perfilId, dto);
  }
}
