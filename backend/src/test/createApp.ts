import express from 'express'
import cors from 'cors'
import authRouter from '../routes/auth.js'
import usersRouter from '../routes/users.js'
import analysesRouter from '../routes/analyses.js'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/auth', authRouter)
  app.use('/users', usersRouter)
  app.use('/analyses', analysesRouter)

  return app
}
