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
      include: {
        usuario: { select: { nomeCompleto: true } },
        bloco: { select: { nome: true } },
        apartamento: { select: { numero: true } },
      },
      orderBy: { chegadaEm: 'desc' },
    });
  }

  async registrar(user: AuthUser, dto: CriarEncomendaDto) {
    if (!dto.usuarioId && !dto.nomeDestinatario) {
      throw new BadRequestException('Informe o morador ou o nome do destinatario.');
    }

    let predioId: string;
    let blocoId = dto.blocoId;
    let apartamentoId = dto.apartamentoId;

    if (dto.usuarioId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: dto.usuarioId },
        include: { apartamento: true },
      });
      if (!usuario || !user.predioIds.includes(usuario.predioId)) {
        throw new BadRequestException('Usuario informado nao pertence a este predio.');
      }
      predioId = usuario.predioId;
      blocoId = usuario.apartamento?.blocoId;
      apartamentoId = usuario.apartamentoId ?? undefined;
    } else {
      if (!blocoId) {
        throw new BadRequestException('Informe o bloco do destinatario.');
      }
      const bloco = await this.prisma.bloco.findUnique({ where: { id: blocoId } });
      if (!bloco || !user.predioIds.includes(bloco.predioId)) {
        throw new BadRequestException('Bloco informado nao pertence a este predio.');
      }
      predioId = bloco.predioId;
    }

    return this.prisma.encomenda.create({
      data: {
        predioId,
        usuarioId: dto.usuarioId,
        nomeDestinatario: dto.usuarioId ? undefined : dto.nomeDestinatario,
        blocoId,
        apartamentoId,
        descricao: dto.descricao,
        // dataChegada e so uma data (sem hora relevante — quem registra so
        // sabe o dia). Ancorar em meio-dia UTC em vez de meia-noite evita
        // que fusos atras de UTC (ex. Brasil, -03) mostrem o dia anterior
        // ao formatar (mesma causa do bug corrigido em Reserva.data).
        ...(dto.dataChegada ? { chegadaEm: new Date(`${dto.dataChegada}T12:00:00.000Z`) } : {}),
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
