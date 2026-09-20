import { Injectable, NotFoundException } from '@nestjs/common';
import type { CriarComentarioDto } from '../common/dto/criar-comentario.dto.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { NotificacoesService } from '../notificacoes/notificacoes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AtualizarAvisoDto } from './dto/atualizar-aviso.dto.js';
import type { CriarAvisoDto } from './dto/criar-aviso.dto.js';
import type { ListarAvisosQueryDto } from './dto/listar-avisos-query.dto.js';

function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

@Injectable()
export class AvisosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async listar(user: AuthUser, query: ListarAvisosQueryDto) {
    return this.prisma.aviso.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(query.categoria ? { categoria: query.categoria } : {}),
        ...(query.localizacaoId ? { localizacaoId: query.localizacaoId } : {}),
        ...(query.data ? { criadoEm: { gte: inicioDoDia(query.data), lte: fimDoDia(query.data) } } : {}),
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(user: AuthUser, id: string) {
    const aviso = await this.prisma.aviso.findUnique({
      where: { id },
      include: { comentarios: { orderBy: { criadoEm: 'asc' } } },
    });
    if (!aviso || !user.predioIds.includes(aviso.predioId)) {
      throw new NotFoundException('Aviso nao encontrado.');
    }
    return aviso;
  }

  async criar(gestorId: string, predioId: string, dto: CriarAvisoDto) {
    return this.prisma.aviso.create({
      data: {
        predioId,
        gestorId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        categoria: dto.categoria,
        localizacaoTipo: dto.localizacaoTipo,
        localizacaoId: dto.localizacaoId,
      },
    });
  }

  async atualizar(user: AuthUser, id: string, dto: AtualizarAvisoDto) {
    await this.buscarEntidadeOuFalhar(user, id);
    return this.prisma.aviso.update({ where: { id }, data: dto });
  }

  async remover(user: AuthUser, id: string) {
    await this.buscarEntidadeOuFalhar(user, id);
    await this.prisma.aviso.delete({ where: { id } });
  }

  async adicionarComentario(user: AuthUser, id: string, dto: CriarComentarioDto) {
    await this.buscarEntidadeOuFalhar(user, id);

    const comentario = await this.prisma.comentario.create({
      data: {
        avisoId: id,
        autorId: user.perfilId,
        autorTipo: user.role,
        texto: dto.texto,
      },
    });

    this.notificacoes.notificarNovoComentario(id);
    return comentario;
  }

  private async buscarEntidadeOuFalhar(user: AuthUser, id: string) {
    const aviso = await this.prisma.aviso.findUnique({ where: { id } });
    if (!aviso || !user.predioIds.includes(aviso.predioId)) {
      throw new NotFoundException('Aviso nao encontrado.');
    }
    return aviso;
  }
}
