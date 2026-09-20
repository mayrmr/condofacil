import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Teste de integracao real das policies de RLS (secao 12: "Integração:
// políticas de RLS — garantir isolamento de dados entre prédios").
// So roda contra um banco Supabase/Postgres de teste de verdade, com
// `prisma/sql/rls.sql` ja aplicado — nao ha como simular RLS em memoria.
// Defina TEST_DATABASE_URL (uma conexao com um role SEM bypassrls, igual ao
// usado em producao) para habilitar; sem essa env var o teste e pulado, nao
// falha, para nao quebrar `npm run test:e2e` neste ambiente sem Supabase.
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)('RLS — isolamento entre predios (integracao real)', () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL! }) });

  const empresaId = randomUUID();
  const predioAId = randomUUID();
  const predioBId = randomUUID();
  const authUserAId = randomUUID();
  const authUserBId = randomUUID();

  beforeAll(async () => {
    await prisma.empresa.create({ data: { id: empresaId, nome: 'Empresa Teste RLS' } });
    await prisma.predio.createMany({
      data: [
        { id: predioAId, empresaId, nome: 'Predio A', endereco: 'Rua A' },
        { id: predioBId, empresaId, nome: 'Predio B', endereco: 'Rua B' },
      ],
    });
    await prisma.usuario.createMany({
      data: [
        {
          authUserId: authUserAId,
          predioId: predioAId,
          nomeCompleto: 'Usuario Predio A',
          email: `a-${randomUUID()}@teste.com`,
        },
        {
          authUserId: authUserBId,
          predioId: predioBId,
          nomeCompleto: 'Usuario Predio B',
          email: `b-${randomUUID()}@teste.com`,
        },
      ],
    });
    await prisma.ocorrencia.create({
      data: {
        predioId: predioAId,
        criadoPorUsuarioId: (await prisma.usuario.findFirstOrThrow({ where: { authUserId: authUserAId } })).id,
        titulo: 'So visivel para o predio A',
        descricao: 'teste rls',
        categoria: 'teste',
        localizacaoTipo: 'AREA_SOCIAL',
        localizacaoId: randomUUID(),
      },
    });
  });

  afterAll(async () => {
    await prisma.predio.deleteMany({ where: { empresaId } });
    await prisma.empresa.delete({ where: { id: empresaId } });
    await prisma.$disconnect();
  });

  async function comoUsuario<T>(authUserId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`set local role authenticated`);
      await tx.$executeRawUnsafe(`select set_config('request.jwt.claim.sub', '${authUserId}', true)`);
      return fn(tx as unknown as PrismaClient);
    });
  }

  it('usuario do predio A nao ve ocorrencias do predio B (e vice-versa)', async () => {
    const visiveisParaA = await comoUsuario(authUserAId, (tx) =>
      tx.ocorrencia.findMany({ where: { predioId: { in: [predioAId, predioBId] } } }),
    );
    expect(visiveisParaA.every((o) => o.predioId === predioAId)).toBe(true);
    expect(visiveisParaA.length).toBeGreaterThan(0);

    const visiveisParaB = await comoUsuario(authUserBId, (tx) =>
      tx.ocorrencia.findMany({ where: { predioId: { in: [predioAId, predioBId] } } }),
    );
    expect(visiveisParaB.some((o) => o.predioId === predioAId)).toBe(false);
  });
});
