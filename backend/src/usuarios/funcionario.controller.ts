import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Roles(Role.FUNCIONARIO)
@Controller('funcionario')
export class FuncionarioController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser, @Query() query: DashboardQueryDto) {
    return this.usuariosService.dashboard(user, query.view);
  }
}
