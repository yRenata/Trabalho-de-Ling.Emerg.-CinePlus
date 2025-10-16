-- CreateEnum
CREATE TYPE "TipoAcesso" AS ENUM ('PLUS', 'PAGO');

-- CreateTable
CREATE TABLE "generos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filmes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "ano" SMALLINT NOT NULL,
    "duracao" INTEGER NOT NULL,
    "preco" DECIMAL(10,2),
    "foto" TEXT NOT NULL,
    "tipoAcesso" "TipoAcesso" NOT NULL DEFAULT 'PLUS',
    "destaque" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "generoId" INTEGER NOT NULL,

    CONSTRAINT "filmes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "filmes" ADD CONSTRAINT "filmes_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "generos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
