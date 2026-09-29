import { randomUUID } from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EXTENSAO_POR_CONTENT_TYPE,
  type SolicitarUploadImagemDto,
} from '../common/dto/solicitar-upload-imagem.dto.js';
import type { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import { gerarCodigoConvite } from '../common/utils/codigo-convite.util.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { AtualizarAreaSocialDto } from './dto/atualizar-area-social.dto.js';
import type { CriarApartamentoDto } from './dto/criar-apartamento.dto.js';
import type { CriarAreaSocialDto } from './dto/criar-area-social.dto.js';
import type { CriarBlocoDto } from './dto/criar-bloco.dto.js';
import type { CriarPredioDto } from './dto/criar-predio.dto.js';

@Injectable()
export class PrediosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async buscarPorId(user: AuthUser, id: string) {
    this.verificarAcesso(user, id);
    const predio = await this.prisma.predio.findUnique({ where: { id } });
    if (!predio) {
      throw new NotFoundException('Predio nao encontrado.');
    }
    return predio;
  }

  // Publico: resolve o predio a partir do codigo curto do link de convite de
  // moradores (/r/:codigo no frontend), sem expor dados sensiveis.
  async buscarPorCodigoConvite(codigo: string) {
    const predio = await this.prisma.predio.findUnique({
      where: { codigoConvite: codigo.toUpperCase() },
      select: { id: true, nome: true },
    });
    if (!predio) {
      throw new NotFoundException('Link de convite invalido.');
    }
    return predio;
  }

  async estruturaPublica(predioId: string) {
    const predio = await this.prisma.predio.findUnique({ where: { id: predioId } });
    if (!predio) {
      throw new NotFoundException('Predio nao encontrado.');
    }
    return this.prisma.bloco.findMany({
      where: { predioId },
      select: { id: true, nome: true, apartamentos: { select: { id: true, numero: true } } },
      orderBy: { nome: 'asc' },
    });
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
    const areas = await this.prisma.areaSocial.findMany({ where: { predioId }, orderBy: { nome: 'asc' } });
    return Promise.all(
      areas.map(async (area) => ({
        ...area,
        fotoUrl: area.fotoUrl ? await this.storage.criarUrlLeitura(area.fotoUrl) : null,
      })),
    );
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
        codigoConvite: gerarCodigoConvite(),
        gestores: { create: { gestorId } },
      },
    });
  }

  // Quando andares+apartamentosPorAndar vem preenchido, gera tudo de uma vez
  // (numeracao andar*100 + unidade, ex.: 101, 102, 201, 202); senao cria so
  // o bloco vazio, do jeito que ja funcionava (apartamentos um a um depois).
  async criarBloco(user: AuthUser, predioId: string, dto: CriarBlocoDto) {
    this.verificarAcesso(user, predioId);
    const bloco = await this.prisma.bloco.create({ data: { predioId, nome: dto.nome } });

    if (dto.andares && dto.apartamentosPorAndar) {
      const apartamentos = [];
      for (let andar = 1; andar <= dto.andares; andar++) {
        for (let unidade = 1; unidade <= dto.apartamentosPorAndar; unidade++) {
          apartamentos.push({ blocoId: bloco.id, numero: String(andar * 100 + unidade) });
        }
      }
      await this.prisma.apartamento.createMany({ data: apartamentos });
    }

    return this.prisma.bloco.findUniqueOrThrow({ where: { id: bloco.id }, include: { apartamentos: true } });
  }

  async criarAreaSocial(user: AuthUser, predioId: string, dto: CriarAreaSocialDto) {
    this.verificarAcesso(user, predioId);
    return this.prisma.areaSocial.create({
      data: {
        predioId,
        nome: dto.nome,
        descricao: dto.descricao,
        capacidadeMaxima: dto.capacidadeMaxima,
        horarioFuncionamento: dto.horarioFuncionamento,
        horarioAbertura: dto.horarioAbertura,
        horarioFechamento: dto.horarioFechamento,
        regras: dto.regras,
      },
    });
  }

  async atualizarAreaSocial(user: AuthUser, predioId: string, areaId: string, dto: AtualizarAreaSocialDto) {
    const area = await this.buscarAreaSocialOuFalhar(user, predioId, areaId);
    return this.prisma.areaSocial.update({
      where: { id: area.id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
        ...(dto.ativa !== undefined ? { ativa: dto.ativa } : {}),
        ...(dto.capacidadeMaxima !== undefined ? { capacidadeMaxima: dto.capacidadeMaxima } : {}),
        ...(dto.horarioFuncionamento !== undefined ? { horarioFuncionamento: dto.horarioFuncionamento } : {}),
        ...(dto.horarioAbertura !== undefined ? { horarioAbertura: dto.horarioAbertura } : {}),
        ...(dto.horarioFechamento !== undefined ? { horarioFechamento: dto.horarioFechamento } : {}),
        ...(dto.regras !== undefined ? { regras: dto.regras } : {}),
      },
    });
  }

  async solicitarUploadFotoAreaSocial(
    user: AuthUser,
    predioId: string,
    areaId: string,
    dto: SolicitarUploadImagemDto,
  ) {
    await this.buscarAreaSocialOuFalhar(user, predioId, areaId);
    const extensao = EXTENSAO_POR_CONTENT_TYPE[dto.contentType];
    const path = `areas-sociais/${areaId}/${randomUUID()}.${extensao}`;
    return this.storage.criarUploadAssinado(path);
  }

  async confirmarFotoAreaSocial(user: AuthUser, predioId: string, areaId: string, dto: ConfirmarImagemDto) {
    const area = await this.buscarAreaSocialOuFalhar(user, predioId, areaId);
    return this.prisma.areaSocial.update({ where: { id: area.id }, data: { fotoUrl: dto.path } });
  }

  async criarApartamento(user: AuthUser, predioId: string, blocoId: string, dto: CriarApartamentoDto) {
    this.verificarAcesso(user, predioId);
    const bloco = await this.prisma.bloco.findUnique({ where: { id: blocoId } });
    if (!bloco || bloco.predioId !== predioId) {
      throw new NotFoundException('Bloco nao encontrado neste predio.');
    }
    return this.prisma.apartamento.create({ data: { blocoId, numero: dto.numero } });
  }

  async removerAreaSocial(user: AuthUser, predioId: string, areaId: string) {
    const area = await this.buscarAreaSocialOuFalhar(user, predioId, areaId);
    const reservas = await this.prisma.reserva.count({ where: { areaId: area.id } });
    if (reservas > 0) {
      throw new ConflictException('Nao e possivel excluir: existem reservas vinculadas a esta area.');
    }
    await this.prisma.areaSocial.delete({ where: { id: area.id } });
  }

  async atualizarBloco(user: AuthUser, predioId: string, blocoId: string, nome: string) {
    const bloco = await this.buscarBlocoOuFalhar(user, predioId, blocoId);
    return this.prisma.bloco.update({ where: { id: bloco.id }, data: { nome } });
  }

  async removerBloco(user: AuthUser, predioId: string, blocoId: string) {
    const bloco = await this.buscarBlocoOuFalhar(user, predioId, blocoId);
    const [apartamentos, encomendas] = await Promise.all([
      this.prisma.apartamento.count({ where: { blocoId: bloco.id } }),
      this.prisma.encomenda.count({ where: { blocoId: bloco.id } }),
    ]);
    if (apartamentos > 0) {
      throw new ConflictException('Nao e possivel excluir: exclua os apartamentos deste bloco primeiro.');
    }
    if (encomendas > 0) {
      throw new ConflictException('Nao e possivel excluir: existem encomendas vinculadas a este bloco.');
    }
    await this.prisma.bloco.delete({ where: { id: bloco.id } });
  }

  async removerApartamento(user: AuthUser, predioId: string, blocoId: string, apartamentoId: string) {
    await this.buscarBlocoOuFalhar(user, predioId, blocoId);
    const apartamento = await this.prisma.apartamento.findUnique({ where: { id: apartamentoId } });
    if (!apartamento || apartamento.blocoId !== blocoId) {
      throw new NotFoundException('Apartamento nao encontrado neste bloco.');
    }
    const [usuarios, encomendas] = await Promise.all([
      this.prisma.usuario.count({ where: { apartamentoId } }),
      this.prisma.encomenda.count({ where: { apartamentoId } }),
    ]);
    if (usuarios > 0) {
      throw new ConflictException('Nao e possivel excluir: existem moradores vinculados a este apartamento.');
    }
    if (encomendas > 0) {
      throw new ConflictException('Nao e possivel excluir: existem encomendas vinculadas a este apartamento.');
    }
    await this.prisma.apartamento.delete({ where: { id: apartamentoId } });
  }

  private async buscarBlocoOuFalhar(user: AuthUser, predioId: string, blocoId: string) {
    this.verificarAcesso(user, predioId);
    const bloco = await this.prisma.bloco.findUnique({ where: { id: blocoId } });
    if (!bloco || bloco.predioId !== predioId) {
      throw new NotFoundException('Bloco nao encontrado neste predio.');
    }
    return bloco;
  }

  private async buscarAreaSocialOuFalhar(user: AuthUser, predioId: string, areaId: string) {
    this.verificarAcesso(user, predioId);
    const area = await this.prisma.areaSocial.findUnique({ where: { id: areaId } });
    if (!area || area.predioId !== predioId) {
      throw new NotFoundException('Area social nao encontrada neste predio.');
    }
    return area;
  }

  private verificarAcesso(user: AuthUser, predioId: string) {
    if (!user.predioIds.includes(predioId)) {
      throw new NotFoundException('Predio nao encontrado.');
    }
  }
}
