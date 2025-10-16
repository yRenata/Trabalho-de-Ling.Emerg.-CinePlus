import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const generoSchema = z.object({
  nome: z.string().min(3,
    { message: "Gênero deve possuir, no mínimo, 3 caracteres" })
})

router.get("/", async (req, res) => {
  try {
    const generos = await prisma.genero.findMany()
    res.status(200).json(generos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = generoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome } = valida.data

  try {
    const genero = await prisma.genero.create({
      data: { nome }
    })
    res.status(201).json(genero)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const genero = await prisma.genero.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(genero)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = generoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome } = valida.data

  try {
    const genero = await prisma.genero.update({
      where: { id: Number(id) },
      data: { nome }
    })
    res.status(200).json(genero)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router
