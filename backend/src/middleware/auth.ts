import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthTokenPayload {
  userId: string
  googleId: string
  email: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    res.status(500).json({ error: 'Server misconfiguration' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
