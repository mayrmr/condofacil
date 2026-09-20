import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { AuthService } from './auth.service.js';
import { AceitarConviteDto } from './dto/aceitar-convite.dto.js';
import { CadastroEmpresaDto } from './dto/cadastro-empresa.dto.js';
import { ConviteDto } from './dto/convite.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Public()
  @Post('cadastro-empresa')
  cadastrarEmpresa(@Body() dto: CadastroEmpresaDto) {
    return this.authService.cadastrarEmpresa(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Roles(Role.GESTOR)
  @Post('convite')
  convite(@CurrentUser() user: AuthUser, @Body() dto: ConviteDto) {
    return this.authService.convite(user.perfilId, dto);
  }

  @Public()
  @Post('convite/:token/aceitar')
  aceitarConvite(@Param('token') token: string, @Body() dto: AceitarConviteDto) {
    return this.authService.aceitarConvite(token, dto);
  }
}
