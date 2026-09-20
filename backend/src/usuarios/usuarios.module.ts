import { Module } from '@nestjs/common';
import { FuncionarioController } from './funcionario.controller.js';
import { GestorController } from './gestor.controller.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  controllers: [UsuariosController, GestorController, FuncionarioController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
