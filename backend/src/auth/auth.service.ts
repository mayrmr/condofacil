import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { gerarCodigoConvite } from '../common/utils/codigo-convite.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { Role } from '../generated/prisma/enums.js';
import type { AceitarConviteDto } from './dto/aceitar-convite.dto.js';
import type { CadastroEmpresaDto } from './dto/cadastro-empresa.dto.js';
import type { ConviteDto } from './dto/convite.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegistroDto } from './dto/registro.dto.js';

const VALIDADE_CONVITE_DIAS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async registro(dto: RegistroDto) {
    const predio = await this.prisma.predio.findUnique({ where: { id: dto.predioId } });
    if (!predio) {
      throw new NotFoundException('Predio nao encontrado.');
    }

    const apartamento = await this.prisma.apartamento.findUnique({
      where: { id: dto.apartamentoId },
      include: { bloco: true },
    });
    if (!apartamento || apartamento.bloco.predioId !== dto.predioId) {
      throw new BadRequestException('Apartamento nao pertence a este predio.');
    }

    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: dto.email,
      password: dto.senha,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Nao foi possivel criar o usuario.');
    }

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          authUserId: data.user.id,
          predioId: dto.predioId,
          apartamentoId: dto.apartamentoId,
          tipoVinculo: dto.tipoVinculo,
          nomeCompleto: dto.nomeCompleto,
          email: dto.email,
        },
      });
      return { id: usuario.id, email: usuario.email, role: Role.USUARIO };
    } catch (err) {
      await this.supabase.admin.auth.admin.deleteUser(data.user.id);
      throw err;
    }
  }

  async cadastrarEmpresa(dto: CadastroEmpresaDto) {
    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: dto.gestorEmail,
      password: dto.gestorSenha,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Nao foi possivel criar o gestor.');
    }

    try {
      const { empresa, predio, gestor } = await this.prisma.$transaction(async (tx) => {
        const empresa = await tx.empresa.create({ data: { nome: dto.empresaNome } });
        const predio = await tx.predio.create({
          data: {
            empresaId: empresa.id,
            nome: dto.predioNome,
            endereco: dto.predioEndereco,
            codigoConvite: gerarCodigoConvite(),
          },
        });
        const gestor = await tx.gestor.create({
          data: {
            authUserId: data.user.id,
            nomeCompleto: dto.gestorNomeCompleto,
            email: dto.gestorEmail,
            predios: { create: { predioId: predio.id } },
          },
        });
        return { empresa, predio, gestor };
      });

      return {
        empresaId: empresa.id,
        predioId: predio.id,
        gestorId: gestor.id,
        email: gestor.email,
        role: Role.GESTOR,
      };
    } catch (err) {
      await this.supabase.admin.auth.admin.deleteUser(data.user.id);
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: dto.email,
      password: dto.senha,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      expiresAt: data.session.expires_at,
    };
  }

  async convite(gestorId: string, dto: ConviteDto) {
    const predios = await this.prisma.predio.findMany({
      where: { id: { in: dto.predioIds } },
      select: { id: true },
    });
    if (predios.length !== dto.predioIds.length) {
      throw new BadRequestException('Um ou mais predios informados nao existem.');
    }

    const tokenBruto = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(tokenBruto);
    const expiraEm = new Date(Date.now() + VALIDADE_CONVITE_DIAS * 24 * 60 * 60 * 1000);

    await this.prisma.convite.create({
      data: {
        email: dto.email,
        role: dto.role,
        predioIds: dto.predioIds,
        area: dto.area,
        tokenHash,
        criadoPorGestorId: gestorId,
        expiraEm,
      },
    });

    // Envio do e-mail com o link de convite fica fora do escopo deste MVP;
    // o token bruto (nao recuperavel depois, so o hash fica no banco) e
    // retornado aqui para o gestor compartilhar manualmente por enquanto.
    return { token: tokenBruto, expiraEm };
  }

  async aceitarConvite(tokenBruto: string, dto: AceitarConviteDto) {
    const tokenHash = this.hashToken(tokenBruto);
    const convite = await this.prisma.convite.findUnique({ where: { tokenHash } });

    if (!convite || convite.status !== 'PENDENTE') {
      throw new BadRequestException('Convite invalido ou ja utilizado.');
    }
    if (convite.expiraEm < new Date()) {
      await this.prisma.convite.update({ where: { id: convite.id }, data: { status: 'EXPIRADO' } });
      throw new BadRequestException('Convite expirado.');
    }

    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: convite.email,
      password: dto.senha,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Nao foi possivel criar o usuario.');
    }

    try {
      const perfilId = await this.prisma.$transaction(async (tx) => {
        if (convite.role === Role.FUNCIONARIO) {
          if (!convite.area) {
            throw new InternalServerErrorException('Convite de funcionario sem area definida.');
          }
          const funcionario = await tx.funcionario.create({
            data: {
              authUserId: data.user.id,
              nomeCompleto: dto.nomeCompleto,
              email: convite.email,
              telefone: dto.telefone,
              area: convite.area,
              predios: { createMany: { data: convite.predioIds.map((predioId) => ({ predioId })) } },
            },
          });
          return funcionario.id;
        }

        const gestor = await tx.gestor.create({
          data: {
            authUserId: data.user.id,
            nomeCompleto: dto.nomeCompleto,
            email: convite.email,
            telefone: dto.telefone,
            predios: { createMany: { data: convite.predioIds.map((predioId) => ({ predioId })) } },
          },
        });
        return gestor.id;
      });

      await this.prisma.convite.update({ where: { id: convite.id }, data: { status: 'ACEITO' } });

      return { id: perfilId, email: convite.email, role: convite.role };
    } catch (err) {
      await this.supabase.admin.auth.admin.deleteUser(data.user.id);
      throw err;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
