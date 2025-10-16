import express from 'express'
import cors from 'cors'

import routesFilmes from './routes/filmes'
import routesGeneros from './routes/generos'
import routesClientes from './routes/clientes'
import routesLogin from './routes/login'
import routesAvaliacoes from './routes/avaliacoes'
import routesDashboard from './routes/dashboard'
import routesAdminLogin from './routes/adminLogin'
import routesAdmins from './routes/admin'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/filmes", routesFilmes)
app.use("/generos", routesGeneros)
app.use("/clientes", routesClientes)
app.use("/clientes/login", routesLogin)
app.use("/avaliacoes", routesAvaliacoes)
app.use("/dashboard", routesDashboard)
app.use("/adminLogin", routesAdminLogin)
app.use("/admins", routesAdmins)

app.get('/', (req, res) => {
  res.send('API: Locação e Filmes Plus')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})