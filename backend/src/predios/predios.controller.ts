import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarApartamentoDto } from './dto/criar-apartamento.dto.js';
import { CriarAreaSocialDto } from './dto/criar-area-social.dto.js';
import { CriarBlocoDto } from './dto/criar-bloco.dto.js';
import { CriarPredioDto } from './dto/criar-predio.dto.js';
import { PrediosService } from './predios.service.js';

@Controller('predios')
export class PrediosController {
  constructor(private readonly prediosService: PrediosService) {}

  @Public()
  @Get('codigo/:codigo')
  buscarPorCodigoConvite(@Param('codigo') codigo: string) {
    return this.prediosService.buscarPorCodigoConvite(codigo);
  }

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

  @Roles(Role.GESTOR)
  @Post(':id/blocos')
  criarBloco(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CriarBlocoDto) {
    return this.prediosService.criarBloco(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/areas-sociais')
  criarAreaSocial(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CriarAreaSocialDto) {
    return this.prediosService.criarAreaSocial(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/blocos/:blocoId/apartamentos')
  criarApartamento(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('blocoId') blocoId: string,
    @Body() dto: CriarApartamentoDto,
  ) {
    return this.prediosService.criarApartamento(user, id, blocoId, dto);
  }
}
