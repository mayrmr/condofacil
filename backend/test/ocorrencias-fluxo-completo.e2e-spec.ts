import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { NotificacoesService } from '../src/notificacoes/notificacoes.service.js';
import { OcorrenciasModule } from '../src/ocorrencias/ocorrencias.module.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StorageService } from '../src/storage/storage.service.js';
import { FakePrismaService } from './fakes/fake-prisma.js';

// Fluxo completo abertura -> analise -> atendimento -> resolvida ->
// avaliacao, exercitando os tres perfis (secao 12 da especificacao).
// Persistencia via FakePrismaService (in-memory): RLS e migrations reais
// exigem um projeto Supabase provisionado, fora do escopo deste teste — ver
// docs/arquitetura-plataforma-chamados.md.
describe('Ocorrencias — fluxo completo (e2e)', () => {
  let app: INestApplication;
  let fakePrisma: FakePrismaService;

  const PREDIO_ID = randomUUID();
  const OUTRO_PREDIO_ID = randomUUID();
  const USUARIO_ID = randomUUID();
  const GESTOR_ID = randomUUID();
  const FUNCIONARIO_ID = randomUUID();
  const OUTRO_FUNCIONARIO_ID = randomUUID();

  function como(role: string, perfilId: string, predioIds: string[] = [PREDIO_ID]) {
    return {
      'x-test-role': role,
      'x-test-perfil-id': perfilId,
      'x-test-predio-ids': predioIds.join(','),
    };
  }

  beforeAll(async () => {
    fakePrisma = new FakePrismaService();
    fakePrisma.funcionarios.push({ id: FUNCIONARIO_ID }, { id: OUTRO_FUNCIONARIO_ID });
    fakePrisma.funcionarioPredios.push({ funcionarioId: FUNCIONARIO_ID, predioId: PREDIO_ID });

    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, OcorrenciasModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .overrideProvider(NotificacoesService)
      .useValue({ notificarMudancaStatus: vi.fn(), notificarNovoComentario: vi.fn() })
      .overrideProvider(StorageService)
      .useValue({
        criarUploadAssinado: vi.fn(),
        criarUrlLeitura: vi.fn(async (path: string) => `https://storage.local/${path}`),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // Substitui o SupabaseAuthGuard (fora de escopo deste modulo isolado):
    // le a identidade simulada dos headers x-test-* em vez de validar um JWT.
    app.use((req: any, _res: any, next: () => void) => {
      const role = req.headers['x-test-role'];
      if (role) {
        req.user = {
          authUserId: 'test-auth-id',
          email: 'teste@example.com',
          role,
          perfilId: req.headers['x-test-perfil-id'],
          nomeCompleto: 'Usuario de Teste',
          predioIds: String(req.headers['x-test-predio-ids'] ?? '').split(',').filter(Boolean),
        };
      }
      next();
    });
    app.useGlobalGuards(new RolesGuard(app.get(Reflector)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let ocorrenciaId: string;

  it('usuario abre a ocorrencia (ABERTURA)', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/ocorrencias')
      .set(como('USUARIO', USUARIO_ID))
      .send({
        titulo: 'Lampada queimada',
        descricao: 'Corredor do bloco A esta escuro',
        categoria: 'iluminacao',
        localizacaoTipo: 'BLOCO',
        localizacaoId: randomUUID(),
      })
      .expect(201);

    expect(resposta.body.statusAtual).toBe('ABERTURA');
    ocorrenciaId = resposta.body.id;
  });

  it('gestor nao pode pular direto para RESOLVIDA (transicao inexistente na maquina de estados)', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ status: 'RESOLVIDA' })
      .expect(400);
  });

  it('funcionario ainda nao atribuido nao pode agir sobre a ocorrencia', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('FUNCIONARIO', FUNCIONARIO_ID))
      .send({ status: 'ANALISE' })
      .expect(403);
  });

  it('gestor move para ANALISE e fica registrado como analista', async () => {
    const resposta = await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ status: 'ANALISE' })
      .expect(200);

    expect(resposta.body.statusAtual).toBe('ANALISE');
    expect(resposta.body.gestorAnaliseId).toBe(GESTOR_ID);
  });

  it('gestor atribui o funcionario responsavel', async () => {
    const resposta = await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/responsavel`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ funcionarioId: FUNCIONARIO_ID })
      .expect(200);

    expect(resposta.body.responsavelFuncionarioId).toBe(FUNCIONARIO_ID);
  });

  it('gestor move para ATENDIMENTO', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ status: 'ATENDIMENTO' })
      .expect(200);
  });

  it('funcionario nao atribuido nao pode agir sobre a ocorrencia', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('FUNCIONARIO', OUTRO_FUNCIONARIO_ID))
      .send({ status: 'AGUARDA_MATERIAL' })
      .expect(403);
  });

  it('funcionario responsavel move para AGUARDA_MATERIAL', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('FUNCIONARIO', FUNCIONARIO_ID))
      .send({ status: 'AGUARDA_MATERIAL' })
      .expect(200);
  });

  it('funcionario responsavel resolve e registra a solucao aplicada', async () => {
    const resposta = await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/status`)
      .set(como('FUNCIONARIO', FUNCIONARIO_ID))
      .send({ status: 'RESOLVIDA', solucaoAplicada: 'Lampada substituida' })
      .expect(200);

    expect(resposta.body.statusAtual).toBe('RESOLVIDA');
    expect(resposta.body.solucaoAplicada).toBe('Lampada substituida');
  });

  it('gestor nao pode avaliar (rota exclusiva do usuario)', async () => {
    await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/avaliacao`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ nota: 5 })
      .expect(403);
  });

  it('usuario que abriu avalia a resolucao', async () => {
    const resposta = await request(app.getHttpServer())
      .patch(`/ocorrencias/${ocorrenciaId}/avaliacao`)
      .set(como('USUARIO', USUARIO_ID))
      .send({ nota: 5, comentario: 'Resolvido rapido' })
      .expect(200);

    expect(resposta.body.statusAtual).toBe('AVALIACAO');
    expect(resposta.body.avaliacaoNota).toBe(5);
  });

  it('historico registra toda a linha do tempo, em ordem', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/ocorrencias/${ocorrenciaId}/historico`)
      .set(como('USUARIO', USUARIO_ID))
      .expect(200);

    expect(resposta.body.map((h: { statusNovo: string }) => h.statusNovo)).toEqual([
      'ABERTURA',
      'ANALISE',
      'ATENDIMENTO',
      'AGUARDA_MATERIAL',
      'RESOLVIDA',
      'AVALIACAO',
    ]);
  });

  it('usuario de outro predio nao enxerga a ocorrencia (isolamento por predio_id)', async () => {
    await request(app.getHttpServer())
      .get(`/ocorrencias/${ocorrenciaId}`)
      .set(como('USUARIO', randomUUID(), [OUTRO_PREDIO_ID]))
      .expect(404);
  });

  it('qualquer perfil do predio pode comentar', async () => {
    await request(app.getHttpServer())
      .post(`/ocorrencias/${ocorrenciaId}/comentarios`)
      .set(como('GESTOR', GESTOR_ID))
      .send({ texto: 'Confirmado pelo sindico' })
      .expect(201);
  });

  it('gestor conclui/exclui a ocorrencia', async () => {
    await request(app.getHttpServer())
      .delete(`/ocorrencias/${ocorrenciaId}`)
      .set(como('GESTOR', GESTOR_ID))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/ocorrencias/${ocorrenciaId}`)
      .set(como('GESTOR', GESTOR_ID))
      .expect(404);
  });
});
