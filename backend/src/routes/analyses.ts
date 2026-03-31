import { Router, Response, Request, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import axios from 'axios'
import { Analysis } from '../models/Analysis.js'
import { User } from '../models/User.js'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js'

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key']
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || apiKey !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

const AI_AGENT_URL = process.env.AI_AGENT_URL ?? 'http://localhost:8000'

async function dispatchToAiAgent(analysisId: string, imageUrl: string, userId: string): Promise<void> {
  try {
    const user = await User.findById(userId).lean()
    const skinProfile = user?.skinProfile ?? null

    await axios.post(`${AI_AGENT_URL}/analyze`, { analysisId, imageUrl, skinProfile })
  } catch (err) {
    console.error('AI agent dispatch failed, marking analysis as failed:', err)
    await Analysis.findByIdAndUpdate(analysisId, { status: 'failed' })
  }
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('INVALID_MIME_TYPE'))
    }
  },
})

const router = Router()

// POST /analyses — upload image, create pending analysis
router.post(
  '/',
  requireAuth,
  (req: Request, res: Response, next: (err?: unknown) => void) => {
    upload.single('image')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' })
      }
      if (err instanceof Error && err.message === 'INVALID_MIME_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' })
      }
      if (err) {
        return next(err)
      }
      next()
    })
  },
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' })
    }

    const backendUrl = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
    const imageUrl = `${backendUrl}/uploads/${req.file.filename}`

    try {
      const analysis = await Analysis.create({
        userId: req.user!.userId,
        imageUrl,
        status: 'pending',
      })

      const analysisId = analysis._id.toString()
      res.status(202).json({ analysisId })

      // Fire-and-forget: dispatch to AI agent after responding to client
      void dispatchToAiAgent(analysisId, imageUrl, req.user!.userId)
      return
    } catch (err) {
      console.error('POST /analyses error:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// GET /analyses/:id — return a single analysis belonging to the authenticated user
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = await Analysis.findById(req.params.id).lean()

    if (!analysis || analysis.userId.toString() !== req.user!.userId) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    return res.json(analysis)
  } catch {
    return res.status(404).json({ error: 'Analysis not found' })
  }
})

// GET /analyses — paginated list of the authenticated user's analyses, newest first
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
  const skip = (page - 1) * limit

  try {
    const [analyses, total] = await Promise.all([
      Analysis.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments({ userId: req.user!.userId }),
    ])

    return res.json({ analyses, total, page, limit })
  } catch (err) {
    console.error('GET /analyses error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /analyses/:id — internal callback from AI agent
router.patch('/:id', requireApiKey, async (req: Request, res: Response) => {
  const { status, ingredients, rating, explanation } = req.body as {
    status?: string
    ingredients?: unknown
    rating?: unknown
    explanation?: unknown
  }

  if (status === 'completed') {
    if (
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5 when status is completed' })
    }
  }

  try {
    const analysis = await Analysis.findByIdAndUpdate(
      req.params.id,
      { status, ingredients, rating, explanation },
      { new: true },
    ).lean()

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    return res.json(analysis)
  } catch {
    return res.status(404).json({ error: 'Analysis not found' })
  }
})

export default router
