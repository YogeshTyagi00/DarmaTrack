import { Router, Request, Response } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const router = Router()

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
}

interface GoogleIdTokenPayload {
  sub: string
  email: string
  name: string
  picture: string
}

router.post('/google', async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const jwtSecret = process.env.JWT_SECRET

  if (!clientId || !clientSecret || !redirectUri || !jwtSecret) {
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
    )

    const { id_token } = tokenResponse.data

    // Decode the id_token (without verification — Google already validated it)
    const decoded = jwt.decode(id_token) as GoogleIdTokenPayload | null

    if (!decoded || !decoded.sub) {
      return res.status(400).json({ error: 'Invalid id_token from Google' })
    }

    const { sub: googleId, email, name: displayName, picture: avatarUrl } = decoded

    // Upsert user by googleId
    const user = await User.findOneAndUpdate(
      { googleId },
      { $set: { email, displayName, avatarUrl } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    // Sign our own JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        googleId: user.googleId,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: '7d' },
    )

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        skinProfile: user.skinProfile ?? null,
      },
    })
  } catch (err) {
    console.error('Google auth error:', err)
    return res.status(401).json({ error: 'Google authentication failed' })
  }
})

export default router
