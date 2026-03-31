import { Router, Response } from 'express'
import { User } from '../models/User.js'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

const VALID_SKIN_TYPES = ['oily', 'dry', 'sensitive', 'acne-prone'] as const

// GET /users/me — return current user + skin profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      skinProfile: user.skinProfile ?? null,
    })
  } catch (err) {
    console.error('GET /users/me error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/me/profile — create or update skin profile
router.post('/me/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { skinType, age, concerns, allergies } = req.body as {
    skinType?: unknown
    age?: unknown
    concerns?: unknown
    allergies?: unknown
  }

  const errors: Record<string, string> = {}

  // Validate skinType
  if (!skinType || !VALID_SKIN_TYPES.includes(skinType as (typeof VALID_SKIN_TYPES)[number])) {
    errors.skinType = `skinType must be one of: ${VALID_SKIN_TYPES.join(', ')}`
  }

  // Validate age
  if (age === undefined || age === null || age === '') {
    errors.age = 'age is required'
  } else if (typeof age !== 'number' || !Number.isFinite(age) || age <= 0) {
    errors.age = 'age must be a positive number'
  }

  // Validate concerns (optional, default [])
  if (concerns !== undefined && concerns !== null) {
    if (
      !Array.isArray(concerns) ||
      !(concerns as unknown[]).every((c) => typeof c === 'string')
    ) {
      errors.concerns = 'concerns must be an array of strings'
    }
  }

  // Validate allergies (optional, default [])
  if (allergies !== undefined && allergies !== null) {
    if (
      !Array.isArray(allergies) ||
      !(allergies as unknown[]).every((a) => typeof a === 'string')
    ) {
      errors.allergies = 'allergies must be an array of strings'
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors })
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        $set: {
          skinProfile: {
            skinType: skinType as (typeof VALID_SKIN_TYPES)[number],
            age: age as number,
            concerns: Array.isArray(concerns) ? concerns : [],
            allergies: Array.isArray(allergies) ? allergies : [],
          },
        },
      },
      { new: true },
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      skinProfile: user.skinProfile ?? null,
    })
  } catch (err) {
    console.error('POST /users/me/profile error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
