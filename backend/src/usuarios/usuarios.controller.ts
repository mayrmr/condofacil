import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.usuariosService.me(user);
  }

  @Patch('me')
  atualizarMe(@CurrentUser() user: AuthUser, @Body() dto: AtualizarUsuarioDto) {
    return this.usuariosService.atualizarMe(user, dto);
  }
}
