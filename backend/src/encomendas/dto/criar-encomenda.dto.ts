import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

// usuarioId identifica um morador cadastrado; quando o destinatario nao tem
// conta na plataforma, usa-se nomeDestinatario + blocoId (+ apartamentoId,
// se o apartamento tambem estiver cadastrado). A validacao de "precisa ter
// um dos dois" fica no service, ja que aqui os dois campos sao opcionais.
export class CriarEncomendaDto {
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  nomeDestinatario?: string;

  @IsOptional()
  @IsUUID()
  blocoId?: string;

  @IsOptional()
  @IsUUID()
  apartamentoId?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  dataChegada?: string;
}
