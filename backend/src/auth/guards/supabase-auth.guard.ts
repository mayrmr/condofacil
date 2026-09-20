import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../../common/types/auth-user.type.js';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';
import { SupabaseService } from '../../supabase/supabase.service.js';

// Valida o Bearer token contra o Supabase Auth (`auth.getUser`) e resolve o
// perfil de aplicacao (Usuario/Funcionario/Gestor) vinculado a esse
// auth_user_id, anexando o resultado em `request.user`. Roda em toda rota,
// exceto as marcadas com @Public() (login/registro/aceitar-convite).
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Token de autenticacao ausente.');
    }

    const { data, error } = await this.supabase.anon.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token de autenticacao invalido ou expirado.');
    }

    const authUser = await this.resolveAuthUser(data.user.id, data.user.email ?? '');
    if (!authUser) {
      throw new UnauthorizedException('Nenhum perfil vinculado a este usuario.');
    }

    request.user = authUser;
    return true;
  }

  private extractToken(authorizationHeader?: string): string | undefined {
    const [type, token] = authorizationHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async resolveAuthUser(authUserId: string, email: string): Promise<AuthUser | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { authUserId } });
    if (usuario) {
      return {
        authUserId,
        email,
        role: 'USUARIO',
        perfilId: usuario.id,
        nomeCompleto: usuario.nomeCompleto,
        predioIds: [usuario.predioId],
      };
    }

    const funcionario = await this.prisma.funcionario.findUnique({
      where: { authUserId },
      include: { predios: true },
    });
    if (funcionario) {
      return {
        authUserId,
        email,
        role: 'FUNCIONARIO',
        perfilId: funcionario.id,
        nomeCompleto: funcionario.nomeCompleto,
        predioIds: funcionario.predios.map((p) => p.predioId),
      };
    }

    const gestor = await this.prisma.gestor.findUnique({
      where: { authUserId },
      include: { predios: true },
    });
    if (gestor) {
      return {
        authUserId,
        email,
        role: 'GESTOR',
        perfilId: gestor.id,
        nomeCompleto: gestor.nomeCompleto,
        predioIds: gestor.predios.map((p) => p.predioId),
      };
    }

    return null;
  }
}
