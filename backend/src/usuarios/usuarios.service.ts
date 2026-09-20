import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/types/auth-user.type.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto.js';
import { VISOES_DASHBOARD, type VisaoDashboard } from './dto/dashboard-query.dto.js';

const VISOES_SOMENTE_GESTOR: VisaoDashboard[] = ['funcionarios', 'areas'];

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
  constructor(private readonly prisma: PrismaService) {}

  async me(user: AuthUser) {
    switch (user.role) {
      case Role.USUARIO: {
        const usuario = await this.prisma.usuario.findUniqueOrThrow({
          where: { id: user.perfilId },
          include: { predio: true, apartamento: true },
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
      case Role.USUARIO:
        return this.prisma.usuario.update({
          where: { id: user.perfilId },
          data: { ...dadosComuns, ...(dto.apartamentoId ? { apartamentoId: dto.apartamentoId } : {}) },
        });
      case Role.FUNCIONARIO:
        return this.prisma.funcionario.update({ where: { id: user.perfilId }, data: dadosComuns });
      case Role.GESTOR:
        return this.prisma.gestor.update({ where: { id: user.perfilId }, data: dadosComuns });
    }
  }

  async listarUsuarios(gestor: AuthUser) {
    return this.prisma.usuario.findMany({
      where: { predioId: { in: gestor.predioIds } },
      include: { predio: true, apartamento: true },
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

  async dashboard(user: AuthUser, view: VisaoDashboard) {
    if (user.role === Role.USUARIO || (VISOES_SOMENTE_GESTOR.includes(view) && user.role !== Role.GESTOR)) {
      throw new ForbiddenException('Este dashboard nao esta disponivel para o seu perfil.');
    }

    const ocorrencias = await this.prisma.ocorrencia.findMany({
      where: { predioId: { in: user.predioIds } },
      orderBy: { criadoEm: 'desc' },
    });

    switch (view) {
      case 'kanban':
        return Object.fromEntries(agruparPor(ocorrencias, (o) => o.statusAtual));
      case 'calendario':
        return Object.fromEntries(
          agruparPor(ocorrencias, (o) => o.criadoEm.toISOString().slice(0, 10)),
        );
      case 'prioridades':
        return Object.fromEntries(agruparPor(ocorrencias, (o) => o.prioridade ?? 'SEM_PRIORIDADE'));
      case 'funcionarios':
        return Object.fromEntries(
          agruparPor(ocorrencias, (o) => o.responsavelFuncionarioId ?? 'SEM_RESPONSAVEL'),
        );
      case 'areas':
        return Object.fromEntries(agruparPor(ocorrencias, (o) => `${o.localizacaoTipo}:${o.localizacaoId}`));
      case 'lista':
      default:
        return ocorrencias;
    }
  }

  readonly visoesDisponiveis = VISOES_DASHBOARD;
}
