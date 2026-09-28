-- Distingue proprietario de inquilino nos moradores, usado no cadastro
-- externo e na pagina de gerenciamento de usuarios do gestor. Default
-- seguro (PROPRIETARIO) pros usuarios ja existentes.
CREATE TYPE "TipoVinculo" AS ENUM ('PROPRIETARIO', 'INQUILINO');

ALTER TABLE "usuarios" ADD COLUMN     "tipo_vinculo" "TipoVinculo" NOT NULL DEFAULT 'PROPRIETARIO';
