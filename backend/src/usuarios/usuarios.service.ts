import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role, StatusOcorrencia } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto.js';
import type { DashboardQueryDto } from './dto/dashboard-query.dto.js';

// Etapas do quadro kanban, na ordem do fluxo completo (secao 6 da
// especificacao) — uma coluna por status, do jeito que o fluxo real de
// ocorrencias do predio funciona. EXCLUIDA fica de fora: e um cancelamento
// antes de analise, nao uma etapa de trabalho. As colunas aparecem sempre,
// mesmo vazias.
const ETAPAS_KANBAN: StatusOcorrencia[] = [
  'ABERTURA',
  'ANALISE',
  'ATENDIMENTO',
  'AGUARDA_MATERIAL',
  'RESOLVIDA',
  'AVALIACAO',
  'CANCELAMENTO',
];

const LABEL_STATUS: Record<StatusOcorrencia, string> = {
  ABERTURA: 'Aberta',
  ANALISE: 'Em analise',
  ATENDIMENTO: 'Em atendimento',
  AGUARDA_MATERIAL: 'Aguardando material',
  RESOLVIDA: 'Resolvida',
  CANCELAMENTO: 'Cancelada',
  AVALIACAO: 'Avaliada',
  EXCLUIDA: 'Excluida',
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function agruparPor<T, K extends string | number>(itens: T[], chave: (item: T) => K): Map<K, T[]> {
  const mapa = new Map<K, T[]>();
  for (const item of itens) {
    const k = chave(item);
    const grupo = mapa.get(k);
    if (grupo) {
      grupo.push(item);
    } else {
      mapa.set(k, [item]);
    }
  }
  return mapa;
}

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async me(user: AuthUser) {
    switch (user.role) {
      case Role.USUARIO: {
        const usuario = await this.prisma.usuario.findUniqueOrThrow({
          where: { id: user.perfilId },
          include: { predio: true, apartamento: { include: { bloco: true } } },
        });
        return { ...usuario, role: Role.USUARIO };
      }
      case Role.FUNCIONARIO: {
        const funcionario = await this.prisma.funcionario.findUniqueOrThrow({
          where: { id: user.perfilId },
          include: { predios: { include: { predio: true } } },
        });
        return { ...funcionario, role: Role.FUNCIONARIO };
      }
      case Role.GESTOR: {
        const gestor = await this.prisma.gestor.findUniqueOrThrow({
          where: { id: user.perfilId },
          include: { predios: { include: { predio: true } } },
        });
        return { ...gestor, role: Role.GESTOR };
      }
    }
  }

  async atualizarMe(user: AuthUser, dto: AtualizarUsuarioDto) {
    const dadosComuns = {
      ...(dto.nomeCompleto ? { nomeCompleto: dto.nomeCompleto } : {}),
      ...(dto.telefone !== undefined ? { telefone: dto.telefone } : {}),
      ...(dto.fotoUrl !== undefined ? { fotoUrl: dto.fotoUrl } : {}),
    };

    switch (user.role) {
      case Role.USUARIO: {
        // Corrigido: antes aceitava qualquer apartamentoId sem checar que
        // ele pertence ao mesmo predio do usuario — um morador podia se
        // "mudar" pra um apartamento de outro predio so informando o UUID.
        if (dto.apartamentoId) {
          const apartamento = await this.prisma.apartamento.findUnique({
            where: { id: dto.apartamentoId },
            include: { bloco: true },
          });
          if (!apartamento || apartamento.bloco.predioId !== user.predioIds[0]) {
            throw new BadRequestException('Apartamento nao pertence ao seu predio.');
          }
        }
        return this.prisma.usuario.update({
          where: { id: user.perfilId },
          data: {
            ...dadosComuns,
            ...(dto.apartamentoId ? { apartamentoId: dto.apartamentoId } : {}),
            ...(dto.tipoVinculo ? { tipoVinculo: dto.tipoVinculo } : {}),
          },
        });
      }
      case Role.FUNCIONARIO:
        return this.prisma.funcionario.update({ where: { id: user.perfilId }, data: dadosComuns });
      case Role.GESTOR:
        return this.prisma.gestor.update({ where: { id: user.perfilId }, data: dadosComuns });
    }
  }

  async listarUsuarios(gestor: AuthUser) {
    return this.prisma.usuario.findMany({
      where: { predioId: { in: gestor.predioIds } },
      include: { predio: true, apartamento: { include: { bloco: true } } },
      orderBy: { nomeCompleto: 'asc' },
    });
  }

  async listarFuncionarios(gestor: AuthUser) {
    return this.prisma.funcionario.findMany({
      where: { predios: { some: { predioId: { in: gestor.predioIds } } } },
      include: { predios: { include: { predio: true } } },
      orderBy: { nomeCompleto: 'asc' },
    });
  }

  async bloquearUsuario(gestor: AuthUser, usuarioId: string, ativo: boolean) {
    const usuario = await this.buscarUsuarioDoGestorOuFalhar(gestor, usuarioId);
    return this.prisma.usuario.update({ where: { id: usuario.id }, data: { ativo } });
  }

  async excluirUsuario(gestor: AuthUser, usuarioId: string) {
    const usuario = await this.buscarUsuarioDoGestorOuFalhar(gestor, usuarioId);
    const [ocorrencias, reservas, visitantes, encomendas] = await Promise.all([
      this.prisma.ocorrencia.count({ where: { criadoPorUsuarioId: usuario.id } }),
      this.prisma.reserva.count({ where: { usuarioId: usuario.id } }),
      this.prisma.visitante.count({ where: { usuarioId: usuario.id } }),
      this.prisma.encomenda.count({ where: { usuarioId: usuario.id } }),
    ]);
    if (ocorrencias > 0 || reservas > 0 || visitantes > 0 || encomendas > 0) {
      throw new ConflictException(
        'Nao e possivel excluir: este usuario possui historico registrado. Bloqueie o acesso em vez disso.',
      );
    }
    await this.prisma.usuario.delete({ where: { id: usuario.id } });
    await this.supabase.admin.auth.admin.deleteUser(usuario.authUserId);
  }

  async bloquearFuncionario(gestor: AuthUser, funcionarioId: string, ativo: boolean) {
    const funcionario = await this.buscarFuncionarioDoGestorOuFalhar(gestor, funcionarioId);
    return this.prisma.funcionario.update({ where: { id: funcionario.id }, data: { ativo } });
  }

  async excluirFuncionario(gestor: AuthUser, funcionarioId: string) {
    const funcionario = await this.buscarFuncionarioDoGestorOuFalhar(gestor, funcionarioId);
    const ocorrencias = await this.prisma.ocorrencia.count({
      where: { responsavelFuncionarioId: funcionario.id },
    });
    if (ocorrencias > 0) {
      throw new ConflictException(
        'Nao e possivel excluir: este funcionario possui ocorrencias atribuidas. Bloqueie o acesso em vez disso.',
      );
    }
    await this.prisma.funcionario.delete({ where: { id: funcionario.id } });
    await this.supabase.admin.auth.admin.deleteUser(funcionario.authUserId);
  }

  private async buscarUsuarioDoGestorOuFalhar(gestor: AuthUser, usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !gestor.predioIds.includes(usuario.predioId)) {
      throw new NotFoundException('Usuario nao encontrado neste predio.');
    }
    return usuario;
  }

  private async buscarFuncionarioDoGestorOuFalhar(gestor: AuthUser, funcionarioId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: funcionarioId },
      include: { predios: true },
    });
    if (!funcionario || !funcionario.predios.some((p) => gestor.predioIds.includes(p.predioId))) {
      throw new NotFoundException('Funcionario nao encontrado neste predio.');
    }
    return funcionario;
  }

  // periodo determina so a janela do "total de ocorrencias" (criadas no
  // intervalo); "em andamento" e "total de usuarios" sao contagens do
  // estado atual, nao fazem sentido janelados por data.
  async resumoGestor(user: AuthUser, periodo: 'mes' | 'trimestre' | 'ano') {
    const dias = { mes: 30, trimestre: 90, ano: 365 }[periodo];
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const [totalOcorrencias, ocorrenciasEmAndamento, totalUsuarios] = await Promise.all([
      this.prisma.ocorrencia.count({
        where: { predioId: { in: user.predioIds }, criadoEm: { gte: desde } },
      }),
      this.prisma.ocorrencia.count({
        where: {
          predioId: { in: user.predioIds },
          statusAtual: { in: ['ANALISE', 'ATENDIMENTO', 'AGUARDA_MATERIAL'] },
        },
      }),
      this.prisma.usuario.count({ where: { predioId: { in: user.predioIds } } }),
    ]);

    return { totalOcorrencias, ocorrenciasEmAndamento, totalUsuarios };
  }

  async resumoUsuario(user: AuthUser) {
    const [encomendasPendentes, proximaReserva] = await Promise.all([
      this.prisma.encomenda.count({
        where: { usuarioId: user.perfilId, status: 'AGUARDANDO_RETIRADA' },
      }),
      this.prisma.reserva.findFirst({
        where: {
          usuarioId: user.perfilId,
          status: { in: ['PENDENTE', 'CONFIRMADA'] },
          data: { gte: new Date(new Date().toISOString().slice(0, 10)) },
        },
        include: { area: true },
        orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      }),
    ]);

    return { encomendasPendentes, proximaReserva };
  }

  async dashboard(user: AuthUser, query: DashboardQueryDto) {
    if (user.role === Role.USUARIO) {
      throw new ForbiddenException('Este dashboard nao esta disponivel para o seu perfil.');
    }

    const ocorrencias = await this.prisma.ocorrencia.findMany({
      where: {
        predioId: { in: user.predioIds },
        ...(query.categoria ? { categoria: query.categoria } : {}),
        ...(query.blocoId ? { localizacaoTipo: 'BLOCO', localizacaoId: query.blocoId } : {}),
        ...(query.responsavelFuncionarioId
          ? { responsavelFuncionarioId: query.responsavelFuncionarioId }
          : {}),
        ...(query.prioridade ? { prioridade: query.prioridade } : {}),
        ...(query.status ? { statusAtual: query.status } : {}),
        ...(query.dataInicio && query.dataFim
          ? {
              criadoEm: {
                gte: new Date(`${query.dataInicio}T00:00:00.000Z`),
                lte: new Date(`${query.dataFim}T23:59:59.999Z`),
              },
            }
          : query.periodoDias
            ? { criadoEm: { gte: new Date(Date.now() - query.periodoDias * 24 * 60 * 60 * 1000) } }
            : {}),
      },
      include: { usuario: { select: { nomeCompleto: true } } },
      orderBy: { criadoEm: 'desc' },
    });

    const nomesLocalizacao = await this.resolverNomesLocalizacao(user.predioIds);
    const comLocalizacao = ocorrencias.map((o) => ({
      ...o,
      localizacaoNome: nomesLocalizacao.get(`${o.localizacaoTipo}:${o.localizacaoId}`) ?? null,
    }));

    // Busca livre: nao da pra filtrar isso tudo no banco porque
    // localizacaoNome/rotulo de status/data formatada sao derivados em
    // memoria (ver comentario da funcao resolverNomesLocalizacao); entao o
    // texto digitado e comparado contra tudo que aparece pro usuario no
    // cartao — titulo, descricao, categoria, autor, local e data.
    const filtrado = query.q ? comLocalizacao.filter((o) => this.correspondeABusca(o, query.q!)) : comLocalizacao;

    switch (query.view) {
      case 'kanban': {
        const agrupado = agruparPor(filtrado, (o) => o.statusAtual);
        return Object.fromEntries(ETAPAS_KANBAN.map((etapa) => [etapa, agrupado.get(etapa) ?? []]));
      }
      case 'calendario':
        return Object.fromEntries(agruparPor(filtrado, (o) => o.criadoEm.toISOString().slice(0, 10)));
      case 'lista':
      default:
        return filtrado;
    }
  }

  private correspondeABusca(
    ocorrencia: {
      titulo: string;
      descricao: string;
      categoria: string;
      statusAtual: StatusOcorrencia;
      criadoEm: Date;
      usuario: { nomeCompleto: string } | null;
      localizacaoNome: string | null;
    },
    termoBusca: string,
  ): boolean {
    const termo = normalizar(termoBusca);
    const dataIso = ocorrencia.criadoEm.toISOString().slice(0, 10);
    const dataBr = ocorrencia.criadoEm.toLocaleDateString('pt-BR');
    const campos = [
      ocorrencia.titulo,
      ocorrencia.descricao,
      ocorrencia.categoria,
      LABEL_STATUS[ocorrencia.statusAtual],
      ocorrencia.usuario?.nomeCompleto,
      ocorrencia.localizacaoNome,
      dataIso,
      dataBr,
    ];
    return campos.some((campo) => campo && normalizar(campo).includes(termo));
  }

  // Resolve o par (localizacaoTipo, localizacaoId) — sem FK declarada no
  // schema (ver comentario no topo do schema.prisma) — em um nome legivel,
  // para exibir nos cartoes do dashboard sem o cliente precisar cruzar
  // varias listas.
  private async resolverNomesLocalizacao(predioIds: string[]) {
    const [blocos, areasSociais] = await Promise.all([
      this.prisma.bloco.findMany({
        where: { predioId: { in: predioIds } },
        include: { apartamentos: true },
      }),
      this.prisma.areaSocial.findMany({ where: { predioId: { in: predioIds } } }),
    ]);

    const nomes = new Map<string, string>();
    for (const bloco of blocos) {
      nomes.set(`BLOCO:${bloco.id}`, bloco.nome);
      for (const apartamento of bloco.apartamentos) {
        nomes.set(`APARTAMENTO:${apartamento.id}`, `${bloco.nome} · apto ${apartamento.numero}`);
      }
    }
    for (const area of areasSociais) {
      nomes.set(`AREA_SOCIAL:${area.id}`, area.nome);
    }
    return nomes;
  }
}
