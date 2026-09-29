import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AvisosModule } from './avisos/avisos.module.js';
import { EncomendasModule } from './encomendas/encomendas.module.js';
import { NotificacoesModule } from './notificacoes/notificacoes.module.js';
import { OcorrenciasModule } from './ocorrencias/ocorrencias.module.js';
import { PrediosModule } from './predios/predios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReservasModule } from './reservas/reservas.module.js';
import { StorageModule } from './storage/storage.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { VisitantesModule } from './visitantes/visitantes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite generoso por IP pra rota nenhuma legitima esbarrar nele — as
    // rotas sensiveis (login, registro, cadastro-empresa, aceitar convite)
    // tem um limite bem mais apertado via @Throttle() no proprio controller.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SupabaseModule,
    StorageModule,
    AuthModule,
    PrediosModule,
    UsuariosModule,
    OcorrenciasModule,
    AvisosModule,
    NotificacoesModule,
    ReservasModule,
    VisitantesModule,
    EncomendasModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
