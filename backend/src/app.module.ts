import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AvisosModule } from './avisos/avisos.module.js';
import { NotificacoesModule } from './notificacoes/notificacoes.module.js';
import { OcorrenciasModule } from './ocorrencias/ocorrencias.module.js';
import { PrediosModule } from './predios/predios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    StorageModule,
    AuthModule,
    PrediosModule,
    UsuariosModule,
    OcorrenciasModule,
    AvisosModule,
    NotificacoesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
