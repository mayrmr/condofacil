import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { CriarReservaDto } from './dto/criar-reserva.dto.js';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listarAreas(user: AuthUser) {
    const areas = await this.prisma.areaSocial.findMany({
      where: { predioId: { in: user.predioIds } },
      orderBy: { nome: 'asc' },
    });
    return Promise.all(
      areas.map(async (area) => ({
        ...area,
        fotoUrl: area.fotoUrl ? await this.storage.criarUrlLeitura(area.fotoUrl) : null,
      })),
    );
  }

  async listar(user: AuthUser) {
    return this.prisma.reserva.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(user.role === Role.USUARIO ? { usuarioId: user.perfilId } : {}),
      },
      include: { area: true },
      orderBy: { data: 'asc' },
    });
  }

  async criar(user: AuthUser, dto: CriarReservaDto) {
    if (user.role !== Role.USUARIO) {
      throw new ForbiddenException('Somente usuarios podem fazer reservas.');
    }

    const area = await this.prisma.areaSocial.findUnique({ where: { id: dto.areaId } });
    if (!area || !user.predioIds.includes(area.predioId) || !area.ativa) {
      throw new BadRequestException('Area indisponivel para reserva.');
    }
    if (dto.horaFim <= dto.horaInicio) {
      throw new BadRequestException('O horario final deve ser depois do horario inicial.');
    }

    const data = new Date(dto.data);
    const conflitos = await this.prisma.reserva.findMany({
      where: { areaId: dto.areaId, data, status: { in: ['CONFIRMADA', 'PENDENTE'] } },
    });
    const sobrepoe = conflitos.some((r) => dto.horaInicio < r.horaFim && dto.horaFim > r.horaInicio);
    if (sobrepoe) {
      throw new BadRequestException('Ja existe uma reserva confirmada ou pendente nesse horario.');
    }

    return this.prisma.reserva.create({
      data: {
        predioId: area.predioId,
        areaId: dto.areaId,
        usuarioId: user.perfilId,
        data,
        horaInicio: dto.horaInicio,
        horaFim: dto.horaFim,
        status: 'PENDENTE',
      },
      include: { area: true },
    });
  }

  async cancelar(user: AuthUser, id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva || !user.predioIds.includes(reserva.predioId)) {
      throw new NotFoundException('Reserva nao encontrada.');
    }
    if (user.role === Role.USUARIO && reserva.usuarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode cancelar suas proprias reservas.');
    }

    return this.prisma.reserva.update({ where: { id }, data: { status: 'CANCELADA' } });
  }

  async aprovar(user: AuthUser, id: string) {
    await this.buscarPendentePorId(user, id);
    return this.prisma.reserva.update({ where: { id }, data: { status: 'CONFIRMADA' }, include: { area: true } });
  }

  async recusar(user: AuthUser, id: string) {
    await this.buscarPendentePorId(user, id);
    return this.prisma.reserva.update({ where: { id }, data: { status: 'CANCELADA' }, include: { area: true } });
  }

  private async buscarPendentePorId(user: AuthUser, id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva || !user.predioIds.includes(reserva.predioId)) {
      throw new NotFoundException('Reserva nao encontrada.');
    }
    if (reserva.status !== 'PENDENTE') {
      throw new BadRequestException('Esta reserva ja foi avaliada.');
    }
    return reserva;
  }
}
