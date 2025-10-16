import { TipoAcesso, PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { verificaToken } from '../middewares/verificaToken'


const prisma = new PrismaClient()

const router = Router()

const filmeSchema = z.object({
  titulo: z.string().min(2,
    { message: "Modelo deve possuir, no mínimo, 2 caracteres" }),
  sinopse: z.string(),
  ano: z.number(),
  duracao: z.number(),
  preco: z.number().optional(),
  foto: z.string(),
  tipoAcesso: z.nativeEnum(TipoAcesso),
  destaque: z.boolean().optional(),
  generoId: z.number(),
})

router.get("/", async (req, res) => {
  try {
    const filmes = await prisma.filme.findMany({
      include: {
        genero: true,
      }
    })
    res.status(200).json(filmes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params
  try {
    const filme = await prisma.filme.findUnique({
      include: {
        genero: true,
      },
       where: { id: Number(id) }
    })
    res.status(200).json(filme)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = filmeSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { titulo, ano, duracao, preco, foto, 
  destaque = true, tipoAcesso = 'PLUS', generoId, sinopse } = valida.data

  try {
    const filme = await prisma.filme.create({
      data: {
        titulo, ano, preco, foto, duracao, destaque,
        tipoAcesso, generoId, sinopse
      }
    })
    res.status(201).json(filme)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)

  try {
    const filmeExistente = await prisma.filme.findUnique({ where: { id } })

    if (!filmeExistente) {
      return res.status(404).json({ erro: "Filme não encontrado" })
    }

    await prisma.avaliacao.deleteMany({ where: { filmeId: id } })
    await prisma.filme.delete({ where: { id } })

    return res.status(200).json({ mensagem: "Filme excluído com sucesso!" }) // ✅ resposta explícita
  } catch (error) {
    console.error("Erro ao deletar filme:", error)
    return res.status(500).json({ erro: "Erro ao deletar filme" })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = filmeSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { titulo, ano, preco, duracao, foto,
    destaque, tipoAcesso, generoId, sinopse } = valida.data

  try {
    const filme = await prisma.filme.update({
      where: { id: Number(id) },
      data: {
        titulo, ano, preco, foto, duracao,
        destaque, tipoAcesso, generoId, sinopse
      }
    })
    res.status(200).json(filme)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.patch("/:id", async (req, res) => {
  const { id } = req.params

  const patchSchema = filmeSchema.partial()

  const valida = patchSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const filme = await prisma.filme.update({
      where: { id: Number(id) },
      data: valida.data, 
    })
    res.status(200).json(filme)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter para número
  const termoNumero = Number(termo)

  // is Not a Number, ou seja, se não é um número: filtra por texto
  if (isNaN(termoNumero)) {
    try {
      const filmes = await prisma.filme.findMany({
        include: { genero: true},
        where: {
          OR: [
            { titulo: { contains: termo, mode: "insensitive" } },
            { genero: { nome: { equals: termo, mode: "insensitive" } } }
          ]
        }
      })
      res.status(200).json(filmes)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    if (termoNumero <= 3000) {
      try {
        const filmes = await prisma.filme.findMany({
          include: { genero: true },
          where: { ano: termoNumero }
        })
        res.status(200).json(filmes)
      } catch (error) {
        res.status(500).json({ erro: error })
      }  
    } else {
      try {
        const filmes = await prisma.filme.findMany({
          include: { genero: true },
          where: { preco: { lte: termoNumero } }
        })
        res.status(200).json(filmes)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    }
  }
})

router.patch("/destacar/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const filmeDestacar = await prisma.filme.findUnique({
      where: { id: Number(id) },
      select: { destaque: true }, 
    });

    const filme = await prisma.filme.update({
      where: { id: Number(id) },
      data: { destaque: !filmeDestacar?.destaque }
    })
    res.status(200).json(filme)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
