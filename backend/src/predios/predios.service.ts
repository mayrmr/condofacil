import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CriarApartamentoDto } from './dto/criar-apartamento.dto.js';
import type { CriarAreaSocialDto } from './dto/criar-area-social.dto.js';
import type { CriarBlocoDto } from './dto/criar-bloco.dto.js';
import type { CriarPredioDto } from './dto/criar-predio.dto.js';

@Injectable()
export class PrediosService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(user: AuthUser, id: string) {
    this.verificarAcesso(user, id);
    const predio = await this.prisma.predio.findUnique({ where: { id } });
    if (!predio) {
      throw new NotFoundException('Predio nao encontrado.');
    }
    return predio;
  }

  async blocos(user: AuthUser, predioId: string) {
    this.verificarAcesso(user, predioId);
    return this.prisma.bloco.findMany({
      where: { predioId },
      include: { apartamentos: true },
      orderBy: { nome: 'asc' },
    });
  }

  async areasSociais(user: AuthUser, predioId: string) {
    this.verificarAcesso(user, predioId);
    return this.prisma.areaSocial.findMany({ where: { predioId }, orderBy: { nome: 'asc' } });
  }

  // Gestor adiciona mais um predio a uma empresa que ele ja administra, e
  // fica automaticamente vinculado a ele.
  async criar(gestorId: string, dto: CriarPredioDto) {
    const gestorJaAdministraEmpresa = await this.prisma.gestorPredio.findFirst({
      where: { gestorId, predio: { empresaId: dto.empresaId } },
    });
    if (!gestorJaAdministraEmpresa) {
      throw new ForbiddenException('Voce nao administra nenhum predio desta empresa.');
    }

    return this.prisma.predio.create({
      data: {
        empresaId: dto.empresaId,
        nome: dto.nome,
        endereco: dto.endereco,
        gestores: { create: { gestorId } },
      },
    });
  }

  async criarBloco(user: AuthUser, predioId: string, dto: CriarBlocoDto) {
    this.verificarAcesso(user, predioId);
    return this.prisma.bloco.create({ data: { predioId, nome: dto.nome } });
  }

  async criarAreaSocial(user: AuthUser, predioId: string, dto: CriarAreaSocialDto) {
    this.verificarAcesso(user, predioId);
    return this.prisma.areaSocial.create({ data: { predioId, nome: dto.nome } });
  }

  async criarApartamento(user: AuthUser, predioId: string, blocoId: string, dto: CriarApartamentoDto) {
    this.verificarAcesso(user, predioId);
    const bloco = await this.prisma.bloco.findUnique({ where: { id: blocoId } });
    if (!bloco || bloco.predioId !== predioId) {
      throw new NotFoundException('Bloco nao encontrado neste predio.');
    }
    return this.prisma.apartamento.create({ data: { blocoId, numero: dto.numero } });
  }

  private verificarAcesso(user: AuthUser, predioId: string) {
    if (!user.predioIds.includes(predioId)) {
      throw new NotFoundException('Predio nao encontrado.');
    }
  }
}
