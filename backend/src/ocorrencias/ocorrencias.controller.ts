import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import { CriarComentarioDto } from '../common/dto/criar-comentario.dto.js';
import { SolicitarUploadImagemDto } from '../common/dto/solicitar-upload-imagem.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { AtualizarPrioridadeDto } from './dto/atualizar-prioridade.dto.js';
import { AtualizarResponsavelDto } from './dto/atualizar-responsavel.dto.js';
import { AtualizarStatusDto } from './dto/atualizar-status.dto.js';
import { AvaliarOcorrenciaDto } from './dto/avaliar-ocorrencia.dto.js';
import { CriarOcorrenciaDto } from './dto/criar-ocorrencia.dto.js';
import { ListarOcorrenciasQueryDto } from './dto/listar-ocorrencias-query.dto.js';
import { OcorrenciasService } from './ocorrencias.service.js';

@Controller('ocorrencias')
export class OcorrenciasController {
  constructor(private readonly ocorrenciasService: OcorrenciasService) {}

  @Get()
  listar(
    @CurrentUser() user: AuthUser,
    @Query() query: ListarOcorrenciasQueryDto,
    @Query('minhas') minhas?: string,
  ) {
    return this.ocorrenciasService.listar(user, query, minhas === 'true');
  }

  @Get(':id')
  buscarPorId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ocorrenciasService.buscarPorId(user, id);
  }

  @Get(':id/historico')
  historico(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ocorrenciasService.historico(user, id);
  }

  @Roles(Role.USUARIO)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarOcorrenciaDto) {
    return this.ocorrenciasService.criar(user, dto);
  }

  @Patch(':id/status')
  atualizarStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AtualizarStatusDto) {
    return this.ocorrenciasService.atualizarStatus(user, id, dto);
  }

  @Roles(Role.USUARIO)
  @Patch(':id/avaliacao')
  avaliar(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AvaliarOcorrenciaDto) {
    return this.ocorrenciasService.avaliar(user, id, dto);
  }

  @Roles(Role.FUNCIONARIO, Role.GESTOR)
  @Patch(':id/prioridade')
  atualizarPrioridade(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AtualizarPrioridadeDto,
  ) {
    return this.ocorrenciasService.atualizarPrioridade(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Patch(':id/responsavel')
  atualizarResponsavel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AtualizarResponsavelDto,
  ) {
    return this.ocorrenciasService.atualizarResponsavel(user, id, dto);
  }

  @Roles(Role.GESTOR)
  @Delete(':id')
  remover(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ocorrenciasService.remover(user, id);
  }

  @Post(':id/comentarios')
  adicionarComentario(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.ocorrenciasService.adicionarComentario(user, id, dto);
  }

  @Post(':id/imagens/solicitar-upload')
  solicitarUploadImagem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SolicitarUploadImagemDto,
  ) {
    return this.ocorrenciasService.solicitarUploadImagem(user, id, dto);
  }

  @Post(':id/imagens')
  confirmarImagem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ConfirmarImagemDto) {
    return this.ocorrenciasService.confirmarImagem(user, id, dto);
  }
}
