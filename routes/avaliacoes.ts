import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import nodemailer from "nodemailer"

const router = Router()
const prisma = new PrismaClient()

const avaliacaoSchema = z.object({
  clienteId: z.string().uuid({ message: "clienteId deve ser um UUID válido" }),
  filmeId: z.number().int({ message: "filmeId deve ser um número inteiro" }),
  comentario: z.string().min(5, { message: "Comentário deve ter pelo menos 5 caracteres" }),
  nota: z.number().int().min(1).max(5),
  resposta: z.string().optional()
})

// 🟢 Criar avaliação
router.post("/", async (req, res) => {
  try {
    const data = avaliacaoSchema.parse(req.body)
    const avaliacao = await prisma.avaliacao.create({ data })
    res.status(201).json(avaliacao)
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ erros: error.errors })
    console.error(error)
    res.status(500).json({ erro: "Erro ao criar avaliação" })
  }
})

// 🟡 Listar todas as avaliações
router.get("/", async (_req, res) => {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        filme: { select: { id: true, titulo: true, genero: true, preco: true, foto: true, ano: true } }
      },
      orderBy: { createdAt: "desc" }
    })
    res.json(avaliacoes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar avaliações" })
  }
})

// 🧹 Rota para admin ver apenas avaliações denunciadas
router.get("/denunciadas", async (_req, res) => {
  try {
    const denuncias = await prisma.avaliacao.findMany({
      where: { denunciado: true },
      include: {
        cliente: { select: { id: true, nome: true } },
        filme: { select: { id: true, titulo: true, foto: true } }
      },
      orderBy: { createdAt: "desc" }
    })
    res.json(denuncias)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar denúncias" })
  }
})

// 🎬 Avaliações por filme
router.get("/filme/:filmeId", async (req, res) => {
  try {
    const filmeId = Number(req.params.filmeId)
    if (isNaN(filmeId)) return res.status(400).json({ erro: "ID do filme inválido" })

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { filmeId },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" }
    })

    res.json(avaliacoes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar avaliações do filme" })
  }
})

// 👤 Avaliações por cliente
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const clienteId = req.params.clienteId
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { clienteId },
      include: {
        cliente: { select: { id: true, nome: true } },
        filme: { select: { id: true, titulo: true, genero: true, preco: true, foto: true, ano: true } }
      },
      orderBy: { createdAt: "desc" }
    })
    res.json(avaliacoes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar avaliações do cliente" })
  }
})

// 🚩 Denunciar uma avaliação
router.patch("/:id/denunciar", async (req, res) => {
  const id = Number(req.params.id)
  console.log("🚩 Tentando denunciar avaliação ID:", id)

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" })
  }

  try {
    // Verifica se a avaliação existe
    const avaliacao = await prisma.avaliacao.findUnique({ where: { id } })

    if (!avaliacao) {
      return res.status(404).json({ erro: "Avaliação não encontrada" })
    }

    // Atualiza para denunciado = true
    const atualizada = await prisma.avaliacao.update({
      where: { id },
      data: { denunciado: true },
    })

    console.log("✅ Avaliação denunciada com sucesso:", atualizada)

    res.json({ mensagem: "Avaliação denunciada com sucesso!", avaliacao: atualizada })
  } catch (error: any) {
    console.error("❌ Erro ao denunciar avaliação:", error)
    res.status(500).json({ erro: "Erro ao denunciar avaliação" })
  }
})



// ✅ Responder avaliação
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id)
  const { resposta } = req.body

  if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" })
  if (!resposta || resposta.trim() === "")
    return res.status(400).json({ erro: "A resposta não pode estar vazia" })

  try {
    const avaliacaoExistente = await prisma.avaliacao.findUnique({ where: { id } })
    if (!avaliacaoExistente) return res.status(404).json({ erro: "Avaliação não encontrada" })

    const avaliacaoAtualizada = await prisma.avaliacao.update({
      where: { id },
      data: { resposta }
    })
    res.json(avaliacaoAtualizada)
  } catch (error) {
    console.error("Erro ao responder avaliação:", error)
    res.status(500).json({ erro: "Erro ao responder avaliação" })
  }
})

// 🔍 Buscar uma avaliação pelo ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" })

  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true } },
        filme: { select: { id: true, titulo: true, genero: true, preco: true, foto: true, ano: true } }
      }
    })

    if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada" })
    res.json(avaliacao)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar avaliação" })
  }
})

// ✏️ Atualizar avaliação
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" })

  try {
    const data = avaliacaoSchema.partial().parse(req.body)
    const avaliacao = await prisma.avaliacao.update({ where: { id }, data })
    res.json(avaliacao)
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ erros: error.errors })
    console.error(error)
    res.status(500).json({ erro: "Erro ao atualizar avaliação" })
  }
})

// 🗑️ Deletar avaliação
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" })

  try {
    await prisma.avaliacao.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao deletar avaliação" })
  }
})

export default router
