import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Cadastro inicial da empresa (secao 3: gestor "pode ser cadastrado ... no
// cadastro inicial da empresa"): cria Empresa + primeiro Predio + o Gestor
// que vai administra-lo, tudo em uma unica chamada publica (nao ha ainda
// nenhum usuario autenticado nesse momento — e o "bootstrap" do condominio
// na plataforma). Predios adicionais depois usam POST /predios (autenticado).
export class CadastroEmpresaDto {
  @IsString()
  @IsNotEmpty()
  empresaNome!: string;

  @IsString()
  @IsNotEmpty()
  predioNome!: string;

  @IsString()
  @IsNotEmpty()
  predioEndereco!: string;

  @IsString()
  @MinLength(3)
  gestorNomeCompleto!: string;

  @IsEmail()
  gestorEmail!: string;

  @IsString()
  @MinLength(8)
  gestorSenha!: string;
}
