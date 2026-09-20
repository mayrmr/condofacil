import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarFaturaDto } from './dto/criar-fatura.dto.js';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(user: AuthUser) {
    return this.prisma.fatura.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(user.role === Role.USUARIO ? { usuarioId: user.perfilId } : {}),
      },
      orderBy: { vencimento: 'desc' },
    });
  }

  async buscarPorId(user: AuthUser, id: string) {
    const fatura = await this.buscarEntidadeOuFalhar(user, id);
    return fatura;
  }

  async criar(user: AuthUser, dto: CriarFaturaDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: dto.usuarioId } });
    if (!usuario || !user.predioIds.includes(usuario.predioId)) {
      throw new BadRequestException('Usuario informado nao pertence a este predio.');
    }

    return this.prisma.fatura.create({
      data: {
        predioId: usuario.predioId,
        usuarioId: dto.usuarioId,
        competencia: dto.competencia,
        valorCentavos: dto.valorCentavos,
        vencimento: new Date(dto.vencimento),
      },
    });
  }

  async pagar(user: AuthUser, id: string) {
    const fatura = await this.buscarEntidadeOuFalhar(user, id);
    if (fatura.usuarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode pagar suas proprias faturas.');
    }
    if (fatura.status === 'PAGA') {
      throw new BadRequestException('Esta fatura ja esta paga.');
    }

    return this.prisma.fatura.update({
      where: { id },
      data: { status: 'PAGA', pagoEm: new Date() },
    });
  }

  private async buscarEntidadeOuFalhar(user: AuthUser, id: string) {
    const fatura = await this.prisma.fatura.findUnique({ where: { id } });
    if (!fatura || !user.predioIds.includes(fatura.predioId)) {
      throw new NotFoundException('Fatura nao encontrada.');
    }
    if (user.role === Role.USUARIO && fatura.usuarioId !== user.perfilId) {
      throw new NotFoundException('Fatura nao encontrada.');
    }
    return fatura;
  }
}
