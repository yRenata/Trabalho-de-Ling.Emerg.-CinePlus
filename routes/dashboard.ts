import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

router.get("/gerais", async (_req, res) => {
  try {
    const clientes = await prisma.cliente.count();
    const filmes = await prisma.filme.count();
    const avaliacoes = await prisma.avaliacao.count();
    res.status(200).json({ clientes, filmes, avaliacoes });
  } catch (error) {
    res.status(400).json(error);
  }
});

type GeneroGroupByNome = {
  nome: string;
  _count: { filmes: number };
};

router.get("/filmesGenero", async (req, res) => {
  try {
    const generos = await prisma.genero.findMany({
      select: {
        nome: true,
        _count: {
          select: { filmes: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    res.json(generos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar gêneros" });
  }
});

router.get("/filmesAcesso", async (_req, res) => {
  try {
    // 1. Agrupa a tabela Filme pelo campo 'tipoAcesso'
    const filmesPorAcesso = await prisma.filme.groupBy({
      by: ["tipoAcesso"],
      // 2. Conta o número de filmes em cada grupo (tipoAcesso)
      _count: {
        id: true,
      },
    });

    // 3. Formata a resposta para o frontend
    const resultadoFormatado = filmesPorAcesso.map((item) => ({
      tipoAcesso: item.tipoAcesso,
      _count: {
        filmes: item._count.id,
      },
    }));

    res.json(resultadoFormatado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar filmes por tipo de acesso" });
  }
});

// Nota: Você pode manter o endpoint filmesMaisAvaliados, mas ele não será usado
// na nova versão do AdminDashboard que criamos.

export default router;
