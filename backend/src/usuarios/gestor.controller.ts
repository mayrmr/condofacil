import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Roles(Role.GESTOR)
@Controller('gestor')
export class GestorController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('usuarios')
  usuarios(@CurrentUser() user: AuthUser) {
    return this.usuariosService.listarUsuarios(user);
  }

  @Get('funcionarios')
  funcionarios(@CurrentUser() user: AuthUser) {
    return this.usuariosService.listarFuncionarios(user);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser, @Query() query: DashboardQueryDto) {
    return this.usuariosService.dashboard(user, query);
  }
}
