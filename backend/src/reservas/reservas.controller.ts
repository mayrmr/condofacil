import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { CriarReservaDto } from './dto/criar-reserva.dto.js';
import { ReservasService } from './reservas.service.js';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // As areas em si sao cadastradas so via /predios/:id/areas-sociais (pagina
  // de estrutura do predio) — aqui e so leitura, para montar o select de
  // "qual area reservar".
  @Get('areas')
  listarAreas(@CurrentUser() user: AuthUser) {
    return this.reservasService.listarAreas(user);
  }

  @Get()
  listar(@CurrentUser() user: AuthUser) {
    return this.reservasService.listar(user);
  }

  @Roles(Role.USUARIO)
  @Post()
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarReservaDto) {
    return this.reservasService.criar(user, dto);
  }

  @Delete(':id')
  cancelar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reservasService.cancelar(user, id);
  }
}
