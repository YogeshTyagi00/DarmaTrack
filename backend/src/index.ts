import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import analysesRouter from './routes/analyses.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3000

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI
if (!mongoUri) {
  console.error('MONGO_URI is not set')
  process.exit(1)
}
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/analyses', analysesRouter)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

export default app
