export type Role = 'USUARIO' | 'FUNCIONARIO' | 'GESTOR';
export type TipoVinculo = 'PROPRIETARIO' | 'INQUILINO';

export type StatusOcorrencia =
  | 'ABERTURA'
  | 'ANALISE'
  | 'ATENDIMENTO'
  | 'AGUARDA_MATERIAL'
  | 'RESOLVIDA'
  | 'CANCELAMENTO'
  | 'AVALIACAO'
  | 'EXCLUIDA';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type LocalizacaoTipo = 'BLOCO' | 'APARTAMENTO' | 'AREA_SOCIAL';
export type LocalizacaoTipoAviso = 'AREA_SOCIAL' | 'BLOCO' | 'GERAL';
export type DestinatarioAviso = 'TODOS' | 'BLOCO';

export type StatusAviso = 'ATIVO' | 'ENCERRADO';

export type StatusReserva = 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA';
export type StatusVisitante = 'AUTORIZADO' | 'EXPIRADO';
export type StatusEncomenda = 'AGUARDANDO_RETIRADA' | 'RETIRADA';

export interface Ocorrencia {
  id: string;
  predioId: string;
  criadoPorUsuarioId: string;
  responsavelFuncionarioId: string | null;
  gestorAnaliseId: string | null;
  titulo: string;
  descricao: string;
  categoria: string;
  localizacaoTipo: LocalizacaoTipo;
  localizacaoId: string;
  prioridade: Prioridade | null;
  statusAtual: StatusOcorrencia;
  solucaoAplicada: string | null;
  observacoesGestao: string | null;
  observacoesFuncionario: string | null;
  avaliacaoNota: number | null;
  avaliacaoComentario: string | null;
  criadoEm: string;
  comentarios?: Comentario[];
  imagens?: (Imagem & { url: string })[];
  usuario?: { nomeCompleto: string };
  localizacaoNome?: string | null;
}

export interface Comentario {
  id: string;
  ocorrenciaId?: string | null;
  avisoId?: string | null;
  autorId: string;
  autorTipo: Role;
  texto: string;
  criadoEm: string;
}

export interface Imagem {
  id: string;
  ocorrenciaId?: string | null;
  avisoId?: string | null;
  storageUrl: string;
}

export interface HistoricoStatus {
  id: string;
  ocorrenciaId: string;
  statusAnterior: StatusOcorrencia | null;
  statusNovo: StatusOcorrencia;
  usuarioResponsavelId: string;
  usuarioResponsavelNome: string | null;
  autorTipo: Role;
  observacao: string | null;
  criadoEm: string;
}

export interface Aviso {
  id: string;
  predioId: string;
  gestorId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  localizacaoTipo: LocalizacaoTipoAviso;
  localizacaoId: string | null;
  destinatarioTipo: DestinatarioAviso;
  destinatarioBlocoId: string | null;
  status: StatusAviso;
  criadoEm: string;
  comentarios?: Comentario[];
  imagens?: (Imagem & { url: string })[];
}

export interface Predio {
  id: string;
  empresaId: string;
  nome: string;
  endereco: string;
  codigoConvite: string;
}

export interface Apartamento {
  id: string;
  blocoId: string;
  numero: string;
  bloco?: { id: string; nome: string };
}

export interface Bloco {
  id: string;
  predioId: string;
  nome: string;
  apartamentos: Apartamento[];
}

export interface AreaSocial {
  id: string;
  predioId: string;
  nome: string;
  descricao: string | null;
  ativa: boolean;
  fotoUrl: string | null;
  capacidadeMaxima: number | null;
  horarioFuncionamento: string | null;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  regras: string | null;
}

export interface PerfilUsuario {
  id: string;
  authUserId: string;
  predioId: string;
  apartamentoId: string | null;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  predio?: Predio;
  apartamento?: Apartamento | null;
  tipoVinculo: TipoVinculo;
  ativo?: boolean;
}

export interface PerfilFuncionarioOuGestor {
  id: string;
  authUserId: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  area?: string;
  predios: { predio: Predio }[];
  ativo?: boolean;
}

export type Perfil = (PerfilUsuario | PerfilFuncionarioOuGestor) & { role?: Role };

export interface Reserva {
  id: string;
  predioId: string;
  areaId: string;
  usuarioId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReserva;
  criadoEm: string;
  area?: AreaSocial;
}

export interface Visitante {
  id: string;
  predioId: string;
  usuarioId: string;
  nome: string;
  documento: string | null;
  dataVisita: string;
  observacao: string | null;
  status: StatusVisitante;
  criadoEm: string;
}

export interface Encomenda {
  id: string;
  predioId: string;
  usuarioId: string | null;
  nomeDestinatario: string | null;
  blocoId: string | null;
  apartamentoId: string | null;
  descricao: string | null;
  status: StatusEncomenda;
  chegadaEm: string;
  retiradaEm: string | null;
  usuario?: { nomeCompleto: string } | null;
  bloco?: { nome: string } | null;
  apartamento?: { numero: string } | null;
}
