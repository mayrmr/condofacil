import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ConfirmarImagemDto } from '../common/dto/confirmar-imagem.dto.js';
import type { CriarComentarioDto } from '../common/dto/criar-comentario.dto.js';
import { EXTENSAO_POR_CONTENT_TYPE } from '../common/dto/solicitar-upload-imagem.dto.js';
import type { SolicitarUploadImagemDto } from '../common/dto/solicitar-upload-imagem.dto.js';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { NotificacoesService } from '../notificacoes/notificacoes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { AtualizarPrioridadeDto } from './dto/atualizar-prioridade.dto.js';
import type { AtualizarResponsavelDto } from './dto/atualizar-responsavel.dto.js';
import type { AtualizarStatusDto } from './dto/atualizar-status.dto.js';
import type { AvaliarOcorrenciaDto } from './dto/avaliar-ocorrencia.dto.js';
import type { CriarOcorrenciaDto } from './dto/criar-ocorrencia.dto.js';
import type { ListarOcorrenciasQueryDto } from './dto/listar-ocorrencias-query.dto.js';
import { TransicaoInvalidaError, validarTransicao } from './state-machine/ocorrencia-state-machine.js';

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
export class OcorrenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
    private readonly storage: StorageService,
  ) {}

  async listar(user: AuthUser, query: ListarOcorrenciasQueryDto, apenasMinhas: boolean) {
    return this.prisma.ocorrencia.findMany({
      where: {
        // Escopo por predio(s) do usuario autenticado — nunca por parametro
        // de query (secao 9 da especificacao).
        predioId: { in: user.predioIds },
        ...(apenasMinhas ? { criadoPorUsuarioId: user.perfilId } : {}),
        ...(query.categoria ? { categoria: query.categoria } : {}),
        ...(query.localizacaoId ? { localizacaoId: query.localizacaoId } : {}),
        ...(query.prioridade ? { prioridade: query.prioridade } : {}),
        ...(query.status ? { statusAtual: query.status } : {}),
        ...(query.data ? { criadoEm: { gte: inicioDoDia(query.data), lte: fimDoDia(query.data) } } : {}),
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(user: AuthUser, id: string) {
    const ocorrencia = await this.prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        comentarios: { orderBy: { criadoEm: 'asc' } },
        imagens: true,
      },
    });

    if (!ocorrencia || !user.predioIds.includes(ocorrencia.predioId)) {
      throw new NotFoundException('Ocorrencia nao encontrada.');
    }

    const imagensComUrl = await Promise.all(
      ocorrencia.imagens.map(async (imagem) => ({
        ...imagem,
        url: await this.storage.criarUrlLeitura(imagem.storageUrl),
      })),
    );

    return { ...ocorrencia, imagens: imagensComUrl };
  }

  // So Usuario abre ocorrencia (ver nota na secao "Modelo de dados" do
  // docs/arquitetura: o ER diagram define a FK criado_por_usuario_id
  // apontando exclusivamente para Usuario). Funcionario/Gestor acompanham e
  // atuam sobre ocorrencias, mas nao as criam em nome proprio.
  async criar(user: AuthUser, dto: CriarOcorrenciaDto) {
    if (user.role !== Role.USUARIO) {
      throw new ForbiddenException('Somente usuarios podem abrir ocorrencias.');
    }

    const [ocorrencia] = await this.prisma.$transaction([
      this.prisma.ocorrencia.create({
        data: {
          predioId: user.predioIds[0],
          criadoPorUsuarioId: user.perfilId,
          titulo: dto.titulo,
          descricao: dto.descricao,
          categoria: dto.categoria,
          localizacaoTipo: dto.localizacaoTipo,
          localizacaoId: dto.localizacaoId,
        },
      }),
    ]);

    await this.prisma.historicoStatus.create({
      data: {
        ocorrenciaId: ocorrencia.id,
        statusAnterior: null,
        statusNovo: 'ABERTURA',
        usuarioResponsavelId: user.perfilId,
        autorTipo: user.role,
      },
    });

    this.notificacoes.notificarMudancaStatus(ocorrencia);
    return ocorrencia;
  }

  async atualizarStatus(user: AuthUser, id: string, dto: AtualizarStatusDto) {
    const ocorrencia = await this.buscarEntidadeOuFalhar(user, id);
    this.verificarPosseParaTransicao(user, ocorrencia);

    try {
      validarTransicao(ocorrencia.statusAtual, dto.status, user.role);
    } catch (err) {
      if (err instanceof TransicaoInvalidaError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const dadosAtualizacao: { statusAtual: typeof dto.status; solucaoAplicada?: string; gestorAnaliseId?: string } = {
      statusAtual: dto.status,
    };
    if (dto.status === 'RESOLVIDA' && dto.solucaoAplicada) {
      dadosAtualizacao.solucaoAplicada = dto.solucaoAplicada;
    }
    // Ao entrar em analise, o gestor que agiu fica registrado como
    // responsavel pela analise (atribuicao automatica, secao 6).
    if (dto.status === 'ANALISE' && user.role === Role.GESTOR) {
      dadosAtualizacao.gestorAnaliseId = user.perfilId;
    }

    const [atualizada] = await this.prisma.$transaction([
      this.prisma.ocorrencia.update({ where: { id }, data: dadosAtualizacao }),
      this.prisma.historicoStatus.create({
        data: {
          ocorrenciaId: id,
          statusAnterior: ocorrencia.statusAtual,
          statusNovo: dto.status,
          usuarioResponsavelId: user.perfilId,
          autorTipo: user.role,
          observacao: dto.observacao,
        },
      }),
    ]);

    this.notificacoes.notificarMudancaStatus(atualizada);
    return atualizada;
  }

  async avaliar(user: AuthUser, id: string, dto: AvaliarOcorrenciaDto) {
    const ocorrencia = await this.buscarEntidadeOuFalhar(user, id);

    if (user.role !== Role.USUARIO || ocorrencia.criadoPorUsuarioId !== user.perfilId) {
      throw new ForbiddenException('Somente quem abriu a ocorrencia pode avalia-la.');
    }

    try {
      validarTransicao(ocorrencia.statusAtual, 'AVALIACAO', user.role);
    } catch (err) {
      if (err instanceof TransicaoInvalidaError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const [atualizada] = await this.prisma.$transaction([
      this.prisma.ocorrencia.update({
        where: { id },
        data: {
          statusAtual: 'AVALIACAO',
          avaliacaoNota: dto.nota,
          avaliacaoComentario: dto.comentario,
        },
      }),
      this.prisma.historicoStatus.create({
        data: {
          ocorrenciaId: id,
          statusAnterior: ocorrencia.statusAtual,
          statusNovo: 'AVALIACAO',
          usuarioResponsavelId: user.perfilId,
          autorTipo: user.role,
        },
      }),
    ]);

    this.notificacoes.notificarMudancaStatus(atualizada);
    return atualizada;
  }

  async atualizarPrioridade(user: AuthUser, id: string, dto: AtualizarPrioridadeDto) {
    await this.buscarEntidadeOuFalhar(user, id);
    return this.prisma.ocorrencia.update({ where: { id }, data: { prioridade: dto.prioridade } });
  }

  async atualizarResponsavel(user: AuthUser, id: string, dto: AtualizarResponsavelDto) {
    const ocorrencia = await this.buscarEntidadeOuFalhar(user, id);

    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: dto.funcionarioId },
      include: { predios: true },
    });
    const atendeEssePredio = funcionario?.predios.some((p) => p.predioId === ocorrencia.predioId);
    if (!funcionario || !atendeEssePredio) {
      throw new BadRequestException('Funcionario informado nao atende este predio.');
    }

    return this.prisma.ocorrencia.update({
      where: { id },
      data: { responsavelFuncionarioId: dto.funcionarioId },
    });
  }

  async remover(user: AuthUser, id: string) {
    await this.buscarEntidadeOuFalhar(user, id);
    await this.prisma.ocorrencia.delete({ where: { id } });
  }

  async adicionarComentario(user: AuthUser, id: string, dto: CriarComentarioDto) {
    await this.buscarEntidadeOuFalhar(user, id);

    const comentario = await this.prisma.comentario.create({
      data: {
        ocorrenciaId: id,
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
    const path = `${id}/${randomUUID()}.${extensao}`;
    return this.storage.criarUploadAssinado(path);
  }

  async confirmarImagem(user: AuthUser, id: string, dto: ConfirmarImagemDto) {
    await this.buscarEntidadeOuFalhar(user, id);
    return this.prisma.imagem.create({ data: { ocorrenciaId: id, storageUrl: dto.path } });
  }

  async historico(user: AuthUser, id: string) {
    await this.buscarEntidadeOuFalhar(user, id);
    return this.prisma.historicoStatus.findMany({
      where: { ocorrenciaId: id },
      orderBy: { criadoEm: 'asc' },
    });
  }

  private async buscarEntidadeOuFalhar(user: AuthUser, id: string) {
    const ocorrencia = await this.prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia || !user.predioIds.includes(ocorrencia.predioId)) {
      throw new NotFoundException('Ocorrencia nao encontrada.');
    }
    return ocorrencia;
  }

  // Alem do perfil estar na lista de roles permitidas pela maquina de
  // estados, algumas transicoes so podem ser feitas por quem "possui" a
  // ocorrencia naquele momento: o usuario que a abriu, ou o funcionario a
  // quem ela foi atribuida.
  private verificarPosseParaTransicao(user: AuthUser, ocorrencia: { criadoPorUsuarioId: string; responsavelFuncionarioId: string | null }) {
    if (user.role === Role.USUARIO && ocorrencia.criadoPorUsuarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode agir sobre ocorrencias que voce mesmo abriu.');
    }
    if (user.role === Role.FUNCIONARIO && ocorrencia.responsavelFuncionarioId !== user.perfilId) {
      throw new ForbiddenException('Voce so pode agir sobre ocorrencias atribuidas a voce.');
    }
  }
}
