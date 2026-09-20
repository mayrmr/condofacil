import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarEnqueteDto } from './dto/criar-enquete.dto.js';
import type { VotarDto } from './dto/votar.dto.js';

@Injectable()
export class EnquetesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(user: AuthUser) {
    const enquetes = await this.prisma.enquete.findMany({
      where: { predioId: { in: user.predioIds } },
      include: { opcoes: { include: { _count: { select: { votos: true } } } } },
      orderBy: { criadoEm: 'desc' },
    });
    return Promise.all(enquetes.map((e) => this.comMeuVoto(user, e)));
  }

  async buscarPorId(user: AuthUser, id: string) {
    const enquete = await this.prisma.enquete.findUnique({
      where: { id },
      include: { opcoes: { include: { _count: { select: { votos: true } } } } },
    });
    if (!enquete || !user.predioIds.includes(enquete.predioId)) {
      throw new NotFoundException('Enquete nao encontrada.');
    }
    return this.comMeuVoto(user, enquete);
  }

  async criar(user: AuthUser, dto: CriarEnqueteDto) {
    return this.prisma.enquete.create({
      data: {
        predioId: user.predioIds[0],
        gestorId: user.perfilId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        opcoes: { createMany: { data: dto.opcoes.map((texto) => ({ texto })) } },
      },
      include: { opcoes: true },
    });
  }

  async votar(user: AuthUser, id: string, dto: VotarDto) {
    const enquete = await this.prisma.enquete.findUnique({ where: { id }, include: { opcoes: true } });
    if (!enquete || !user.predioIds.includes(enquete.predioId)) {
      throw new NotFoundException('Enquete nao encontrada.');
    }
    if (enquete.status === 'ENCERRADA') {
      throw new BadRequestException('Esta enquete ja foi encerrada.');
    }
    if (!enquete.opcoes.some((o) => o.id === dto.opcaoId)) {
      throw new BadRequestException('Opcao invalida para esta enquete.');
    }

    await this.prisma.votoEnquete.upsert({
      where: { enqueteId_autorId: { enqueteId: id, autorId: user.perfilId } },
      create: { enqueteId: id, opcaoId: dto.opcaoId, autorId: user.perfilId, autorTipo: user.role },
      update: { opcaoId: dto.opcaoId },
    });

    return this.buscarPorId(user, id);
  }

  async encerrar(user: AuthUser, id: string) {
    const enquete = await this.prisma.enquete.findUnique({ where: { id } });
    if (!enquete || !user.predioIds.includes(enquete.predioId)) {
      throw new NotFoundException('Enquete nao encontrada.');
    }
    return this.prisma.enquete.update({ where: { id }, data: { status: 'ENCERRADA' } });
  }

  private async comMeuVoto<T extends { id: string }>(user: AuthUser, enquete: T) {
    const meuVoto = await this.prisma.votoEnquete.findUnique({
      where: { enqueteId_autorId: { enqueteId: enquete.id, autorId: user.perfilId } },
    });
    return { ...enquete, minhaOpcaoId: meuVoto?.opcaoId ?? null };
  }
}
