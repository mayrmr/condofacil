import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarEncomendaDto } from './dto/criar-encomenda.dto.js';

@Injectable()
export class EncomendasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(user: AuthUser) {
    return this.prisma.encomenda.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(user.role === Role.USUARIO ? { usuarioId: user.perfilId } : {}),
      },
      orderBy: { chegadaEm: 'desc' },
    });
  }

  async registrar(user: AuthUser, dto: CriarEncomendaDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: dto.usuarioId } });
    if (!usuario || !user.predioIds.includes(usuario.predioId)) {
      throw new BadRequestException('Usuario informado nao pertence a este predio.');
    }

    return this.prisma.encomenda.create({
      data: {
        predioId: usuario.predioId,
        usuarioId: dto.usuarioId,
        descricao: dto.descricao,
        registradoPorId: user.perfilId,
      },
    });
  }

  async retirar(user: AuthUser, id: string) {
    const encomenda = await this.prisma.encomenda.findUnique({ where: { id } });
    if (!encomenda || !user.predioIds.includes(encomenda.predioId)) {
      throw new NotFoundException('Encomenda nao encontrada.');
    }
    if (user.role === Role.USUARIO && encomenda.usuarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode retirar suas proprias encomendas.');
    }

    return this.prisma.encomenda.update({
      where: { id },
      data: { status: 'RETIRADA', retiradaEm: new Date() },
    });
  }
}
