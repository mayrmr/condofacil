import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import type { CriarComentarioDto } from '../common/dto/criar-comentario.dto.js';
import { EXTENSAO_POR_CONTENT_TYPE } from '../common/dto/solicitar-upload-imagem.dto.js';
import type { SolicitarUploadImagemDto } from '../common/dto/solicitar-upload-imagem.dto.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { NotificacoesService } from '../notificacoes/notificacoes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
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
    private readonly storage: StorageService,
  ) {}

  async listar(user: AuthUser, query: ListarAvisosQueryDto) {
    const filtroDestinatario = await this.filtroDestinatarioPara(user);

    const avisos = await this.prisma.aviso.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...filtroDestinatario,
        ...(query.categoria ? { categoria: query.categoria } : {}),
        ...(query.localizacaoId ? { localizacaoId: query.localizacaoId } : {}),
        ...(query.data ? { criadoEm: { gte: inicioDoDia(query.data), lte: fimDoDia(query.data) } } : {}),
      },
      include: { imagens: true },
      orderBy: { criadoEm: 'desc' },
    });

    return Promise.all(avisos.map((aviso) => this.comUrlsDeImagem(aviso)));
  }

  // FUNCIONARIO/GESTOR veem tudo do(s) predio(s) deles. USUARIO so ve avisos
  // "para todos" ou destinados ao bloco do proprio apartamento.
  private async filtroDestinatarioPara(user: AuthUser) {
    if (user.role !== Role.USUARIO) {
      return {};
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.perfilId },
      include: { apartamento: true },
    });
    const blocoId = usuario?.apartamento?.blocoId;

    return {
      OR: [
        { destinatarioTipo: 'TODOS' as const },
        ...(blocoId ? [{ destinatarioTipo: 'BLOCO' as const, destinatarioBlocoId: blocoId }] : []),
      ],
    };
  }

  async buscarPorId(user: AuthUser, id: string) {
    const aviso = await this.prisma.aviso.findUnique({
      where: { id },
      include: { comentarios: { orderBy: { criadoEm: 'asc' } }, imagens: true },
    });
    if (!aviso || !user.predioIds.includes(aviso.predioId)) {
      throw new NotFoundException('Aviso nao encontrado.');
    }
    return this.comUrlsDeImagem(aviso);
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
        destinatarioTipo: dto.destinatarioTipo,
        destinatarioBlocoId: dto.destinatarioBlocoId,
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

  async solicitarUploadImagem(user: AuthUser, id: string, dto: SolicitarUploadImagemDto) {
    await this.buscarEntidadeOuFalhar(user, id);

    const extensao = EXTENSAO_POR_CONTENT_TYPE[dto.contentType];
    const path = `avisos/${id}/${randomUUID()}.${extensao}`;
    return this.storage.criarUploadAssinado(path);
  }

  async confirmarImagem(user: AuthUser, id: string, dto: ConfirmarImagemDto) {
    await this.buscarEntidadeOuFalhar(user, id);
    return this.prisma.imagem.create({ data: { avisoId: id, storageUrl: dto.path } });
  }

  private async comUrlsDeImagem<T extends { imagens: { id: string; storageUrl: string }[] }>(aviso: T) {
    const imagensComUrl = await Promise.all(
      aviso.imagens.map(async (imagem) => ({
        ...imagem,
        url: await this.storage.criarUrlLeitura(imagem.storageUrl),
      })),
    );
    return { ...aviso, imagens: imagensComUrl };
  }

  private async buscarEntidadeOuFalhar(user: AuthUser, id: string) {
    const aviso = await this.prisma.aviso.findUnique({ where: { id } });
    if (!aviso || !user.predioIds.includes(aviso.predioId)) {
      throw new NotFoundException('Aviso nao encontrado.');
    }
    return aviso;
  }
}
