import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';

// So o health-check, isolado de AppModule: o modulo completo exige
// DATABASE_URL/SUPABASE_* reais (PrismaService/SupabaseService conectam no
// onModuleInit), que so existem com um projeto Supabase provisionado.
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) retorna status de saude', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ status: 'ok', service: 'plataforma-chamados-backend' });
  });

  afterEach(async () => {
    await app.close();
  });
});
