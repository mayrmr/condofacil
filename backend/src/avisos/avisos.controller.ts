import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import { CriarComentarioDto } from '../common/dto/criar-comentario.dto.js';
import { SolicitarUploadImagemDto } from '../common/dto/solicitar-upload-imagem.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { AvisosService } from './avisos.service.js';
import { AtualizarAvisoDto } from './dto/atualizar-aviso.dto.js';
import { CriarAvisoDto } from './dto/criar-aviso.dto.js';
import { ListarAvisosQueryDto } from './dto/listar-avisos-query.dto.js';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser, @Query() query: ListarAvisosQueryDto) {
    return this.avisosService.listar(user, query);
  }

  @Get(':id')
  buscarPorId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.avisosService.buscarPorId(user, id);
  }

  @Roles(Role.GESTOR)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarAvisoDto) {
    return this.avisosService.criar(user.perfilId, user.predioIds[0], dto);
  }

  @Roles(Role.GESTOR)
  @Patch(':id')
  atualizar(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AtualizarAvisoDto) {
    return this.avisosService.atualizar(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Delete(':id')
  remover(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.avisosService.remover(user, id);
  }

  @Post(':id/comentarios')
  adicionarComentario(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.avisosService.adicionarComentario(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/imagens/solicitar-upload')
  solicitarUploadImagem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SolicitarUploadImagemDto,
  ) {
    return this.avisosService.solicitarUploadImagem(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Post(':id/imagens')
  confirmarImagem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ConfirmarImagemDto) {
    return this.avisosService.confirmarImagem(user, id, dto);
  }
}
