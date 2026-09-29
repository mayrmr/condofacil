import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import { SolicitarUploadImagemDto } from '../common/dto/solicitar-upload-imagem.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { AtualizarAreaSocialDto } from './dto/atualizar-area-social.dto.js';
import { AtualizarBlocoDto } from './dto/atualizar-bloco.dto.js';
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

  // Publico: so blocos/apartamentos (id/nome/numero), pra popular os
  // selects em cascata da tela de cadastro, antes do morador ter login.
  @Public()
  @Get(':id/estrutura-publica')
  estruturaPublica(@Param('id') id: string) {
    return this.prediosService.estruturaPublica(id);
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
  @Patch(':id/areas-sociais/:areaId')
  atualizarAreaSocial(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('areaId') areaId: string,
    @Body() dto: AtualizarAreaSocialDto,
  ) {
    return this.prediosService.atualizarAreaSocial(user, id, areaId, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/areas-sociais/:areaId/foto/solicitar-upload')
  solicitarUploadFotoAreaSocial(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('areaId') areaId: string,
    @Body() dto: SolicitarUploadImagemDto,
  ) {
    return this.prediosService.solicitarUploadFotoAreaSocial(user, id, areaId, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/areas-sociais/:areaId/foto')
  confirmarFotoAreaSocial(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('areaId') areaId: string,
    @Body() dto: ConfirmarImagemDto,
  ) {
    return this.prediosService.confirmarFotoAreaSocial(user, id, areaId, dto);
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

  @Roles(Role.GESTOR)
  @Delete(':id/areas-sociais/:areaId')
  removerAreaSocial(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('areaId') areaId: string) {
    return this.prediosService.removerAreaSocial(user, id, areaId);
  }

  @Roles(Role.GESTOR)
  @Patch(':id/blocos/:blocoId')
  atualizarBloco(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('blocoId') blocoId: string,
    @Body() dto: AtualizarBlocoDto,
  ) {
    return this.prediosService.atualizarBloco(user, id, blocoId, dto.nome);
  }

  @Roles(Role.GESTOR)
  @Delete(':id/blocos/:blocoId')
  removerBloco(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('blocoId') blocoId: string) {
    return this.prediosService.removerBloco(user, id, blocoId);
  }

  @Roles(Role.GESTOR)
  @Delete(':id/blocos/:blocoId/apartamentos/:apartamentoId')
  removerApartamento(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('blocoId') blocoId: string,
    @Param('apartamentoId') apartamentoId: string,
  ) {
    return this.prediosService.removerApartamento(user, id, blocoId, apartamentoId);
  }
}
