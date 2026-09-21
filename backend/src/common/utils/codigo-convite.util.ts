import { randomBytes } from 'node:crypto';

// Codigo curto (8 chars) usado no link publico de autocadastro de moradores
// (/r/:codigo no frontend) — evita expor o uuid do predio na URL.
export function gerarCodigoConvite(): string {
  return randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
}
