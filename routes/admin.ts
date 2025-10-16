import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
    nome: z.string().min(10, { message: "Nome do admin deve possuir, no mínimo, 10 caracteres" }),
    email: z.string().email({ message: "Informe um e-mail válido" }),
    senha: z.string(),
    nivel: z.number().int().min(1, { message: "Nível mínimo é 1" }).max(3, { message: "Nível máximo é 3" })
})

router.get("/", async (req, res) => {
    try {
        const admins = await prisma.admin.findMany()
        res.status(200).json(admins)
    } catch (error) {
        res.status(400).json(error)
    }               
})

function validaSenha(senha: string) {

    const mensa: string[] = [] 

    // .length: retorna o tamanho da string (da senha)
    if (senha.length < 8) {
        mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
    }

    // contadores
    let pequenas = 0
    let grandes = 0
    let numeros = 0
    let simbolos = 0    

    // senha = "abc123"
    // letra = "a"

    // percorre as letras da variável senha
    for (const letra of senha) {
        // expressão regular
        if ((/[a-z]/).test(letra)) {       
            pequenas++
        } else if ((/[A-Z]/).test(letra)) {
            grandes++
        } else if ((/[0-9]/).test(letra)) {
            numeros++
        } else {
            simbolos++
        }
    }

    if (pequenas === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 letra minúscula")
    }
    if (grandes === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 letra maiúscula")
    }   
    if (numeros === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 número")
    }
    if (simbolos === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 símbolo")
    }
    return mensa
}

router.post("/", async (req, res) => {

    const valida = adminSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erros: valida.error.errors })
        return
    }

    const erros = validaSenha(valida.data.senha)
    if (erros.length > 0) {
        res.status(400).json({ erros: erros })
        return
    }

    // 12 é o número de voltas (repetições) que o algoritmo de hash irá executar para "embaralhar" a senha (salt/tempero)
    const salt =  bcrypt.genSaltSync(12)
    //gerar o hash (senha embaralhada)
    const hash = bcrypt.hashSync(valida.data.senha, salt)

    const { nome, email, nivel } = valida.data

    // para o campo senha, será inserido o hash
    try {
        const admin = await prisma.admin.create({
            data: {
                nome,
                email,
                senha: hash,
                nivel
            }
        })
        res.status(201).json(admin)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
        const id = Number(req.params.id)
        const admin = await prisma.admin.findFirst({
            where: { id }
        })
        res.status(200).json(admin)
    } catch (error) {
        res.status(400).json(error)
    }   
})

export default router