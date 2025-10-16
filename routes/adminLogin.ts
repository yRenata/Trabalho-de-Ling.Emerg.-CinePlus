import jwt from "jsonwebtoken" 
import { PrismaClient } from "@prisma/client" 
import { Router } from "express" 
import bcrypt from "bcrypt" 

const prisma = new PrismaClient() 
const router = Router() 

router.post("/", async (req, res) => {
  const { email, senha } = req.body 

  // em termos de segurança, é melhor não informar se o email ou a senha estão incorretos
  // informar apenas que os dados estão incorretos
  const mensagemErro = "Email ou senha incorretos" 

  if (!email || !senha) {
    // res.status(400).json({ erro: "Email e senha são obrigatórios" })
    res.status(400).json({ erro: mensagemErro }) 
    return 
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: { email }
    }) 

    if (admin == null) {
    //  res.status(400).json({ erro: "Email inválido" })
       res.status(400).json({ erro: mensagemErro }) 
      return 
    }

    // Se o email for válido, verificar a senha
    if (bcrypt.compareSync(senha, admin.senha)) {
      // Se confere, gera e retorna o token
      const token = jwt.sign(
        {
          userLogadoId: admin.id,
          userLogadoNome: admin.nome,
          userLogadoNivel: admin.nivel,
        },
        process.env.JWT_KEY as string,
        {
          expiresIn: "1h",
        }
      ) 

      res.status(200).json({
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        nivel: admin.nivel,
        token
      }) 
    } else {
      res.status(400).json({ erro: mensagemErro}) 
    }
  } catch (error) {
    res.status(400).json({ erro: error }) 
  }
}) 

export default router 