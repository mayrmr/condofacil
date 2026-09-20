import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarVisitanteDto } from './dto/criar-visitante.dto.js';

@Injectable()
export class VisitantesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(user: AuthUser) {
    return this.prisma.visitante.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(user.role === Role.USUARIO ? { usuarioId: user.perfilId } : {}),
      },
      orderBy: { dataVisita: 'desc' },
    });
  }

  async criar(user: AuthUser, dto: CriarVisitanteDto) {
    if (user.role !== Role.USUARIO) {
      throw new ForbiddenException('Somente usuarios podem autorizar visitantes.');
    }

    return this.prisma.visitante.create({
      data: {
        predioId: user.predioIds[0],
        usuarioId: user.perfilId,
        nome: dto.nome,
        documento: dto.documento,
        dataVisita: new Date(dto.dataVisita),
        observacao: dto.observacao,
      },
    });
  }

  async remover(user: AuthUser, id: string) {
    const visitante = await this.prisma.visitante.findUnique({ where: { id } });
    if (!visitante || !user.predioIds.includes(visitante.predioId)) {
      throw new NotFoundException('Visitante nao encontrado.');
    }
    if (user.role === Role.USUARIO && visitante.usuarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode remover visitantes que voce autorizou.');
    }

    await this.prisma.visitante.delete({ where: { id } });
  }
}
