import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { createApp } from './createApp.js'
import { User } from '../models/User.js'

const JWT_SECRET = 'test-secret'
const app = createApp()

beforeAll(async () => {
  const uri = process.env.MONGO_TEST_URI!
  await mongoose.connect(uri)
  process.env.JWT_SECRET = JWT_SECRET
})

afterAll(async () => {
  await mongoose.disconnect()
})

afterEach(async () => {
  await User.deleteMany({})
})

async function createUserAndToken(overrides: Partial<{
  googleId: string
  email: string
  displayName: string
  avatarUrl: string
}> = {}) {
  const user = await User.create({
    googleId: overrides.googleId ?? 'google-test-id',
    email: overrides.email ?? 'test@example.com',
    displayName: overrides.displayName ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? 'https://example.com/avatar.jpg',
  })

  const token = jwt.sign(
    { userId: user._id.toString(), googleId: user.googleId, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' },
  )

  return { user, token }
}

describe('GET /users/me', () => {
  it('returns the current user when authenticated', async () => {
    const { user, token } = await createUserAndToken()

    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(user._id.toString())
    expect(res.body.email).toBe('test@example.com')
    expect(res.body.skinProfile).toBeNull()
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/users/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /users/me/profile', () => {
  it('persists and returns the updated user when payload is valid', async () => {
    const { token } = await createUserAndToken()

    const profile = {
      skinType: 'oily',
      age: 28,
      concerns: ['acne', 'redness'],
      allergies: ['fragrance'],
    }

    const res = await request(app)
      .post('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(profile)

    expect(res.status).toBe(200)
    expect(res.body.skinProfile.skinType).toBe('oily')
    expect(res.body.skinProfile.age).toBe(28)
    expect(res.body.skinProfile.concerns).toEqual(['acne', 'redness'])
    expect(res.body.skinProfile.allergies).toEqual(['fragrance'])
  })

  it('returns 400 when skinType is missing', async () => {
    const { token } = await createUserAndToken()

    const res = await request(app)
      .post('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ age: 25 })

    expect(res.status).toBe(400)
    expect(res.body.errors.skinType).toBeDefined()
  })

  it('returns 400 when age is missing', async () => {
    const { token } = await createUserAndToken()

    const res = await request(app)
      .post('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ skinType: 'dry' })

    expect(res.status).toBe(400)
    expect(res.body.errors.age).toBeDefined()
  })

  it('returns 400 when both required fields are missing', async () => {
    const { token } = await createUserAndToken()

    const res = await request(app)
      .post('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.errors.skinType).toBeDefined()
    expect(res.body.errors.age).toBeDefined()
  })

  it('returns 400 when skinType is an invalid value', async () => {
    const { token } = await createUserAndToken()

    const res = await request(app)
      .post('/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ skinType: 'combination', age: 30 })

    expect(res.status).toBe(400)
    expect(res.body.errors.skinType).toBeDefined()
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/users/me/profile')
      .send({ skinType: 'dry', age: 30 })

    expect(res.status).toBe(401)
  })
})
