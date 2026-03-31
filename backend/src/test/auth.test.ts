import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { createApp } from './createApp.js'
import { User } from '../models/User.js'

// Mock axios so we never hit Google's servers
vi.mock('axios')
import axios from 'axios'
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> }

const JWT_SECRET = 'test-secret'
const app = createApp()

beforeAll(async () => {
  const uri = process.env.MONGO_TEST_URI!
  await mongoose.connect(uri)
  process.env.JWT_SECRET = JWT_SECRET
  process.env.GOOGLE_CLIENT_ID = 'test-client-id'
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/callback'
})

afterAll(async () => {
  await mongoose.disconnect()
})

afterEach(async () => {
  await User.deleteMany({})
  vi.clearAllMocks()
})

function makeIdToken(payload: Record<string, string>) {
  // Build a fake id_token that jwt.decode() can parse (not verified by our code)
  return jwt.sign(payload, 'google-secret')
}

describe('POST /auth/google', () => {
  it('creates a new user when Google ID is not yet in the database', async () => {
    const idToken = makeIdToken({
      sub: 'google-uid-001',
      email: 'alice@example.com',
      name: 'Alice',
      picture: 'https://example.com/alice.jpg',
    })

    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id_token: idToken, access_token: 'access', token_type: 'Bearer', expires_in: 3600 },
    })

    const res = await request(app).post('/auth/google').send({ code: 'auth-code-123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('alice@example.com')
    expect(res.body.user.displayName).toBe('Alice')

    const dbUser = await User.findOne({ googleId: 'google-uid-001' })
    expect(dbUser).not.toBeNull()
  })

  it('returns the same user record when the Google ID already exists', async () => {
    const idToken = makeIdToken({
      sub: 'google-uid-002',
      email: 'bob@example.com',
      name: 'Bob',
      picture: 'https://example.com/bob.jpg',
    })

    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id_token: idToken, access_token: 'access', token_type: 'Bearer', expires_in: 3600 },
    })

    // First call — creates the user
    const res1 = await request(app).post('/auth/google').send({ code: 'code-1' })
    expect(res1.status).toBe(200)
    const firstId = res1.body.user.id

    // Second call — same Google ID, should return same _id
    const res2 = await request(app).post('/auth/google').send({ code: 'code-2' })
    expect(res2.status).toBe(200)
    expect(res2.body.user.id).toBe(firstId)

    // Only one document in the DB
    const count = await User.countDocuments({ googleId: 'google-uid-002' })
    expect(count).toBe(1)
  })

  it('returns 400 when no authorization code is provided', async () => {
    const res = await request(app).post('/auth/google').send({})
    expect(res.status).toBe(400)
  })

  it('returns 401 when Google token exchange fails', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('network error'))

    const res = await request(app).post('/auth/google').send({ code: 'bad-code' })
    expect(res.status).toBe(401)
  })
})
