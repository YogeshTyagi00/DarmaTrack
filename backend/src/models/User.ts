import mongoose, { Schema, model, Document } from 'mongoose'

export interface ISkinProfile {
  skinType: 'oily' | 'dry' | 'sensitive' | 'acne-prone'
  age: number
  concerns: string[]
  allergies: string[]
}

export interface IUser extends Document {
  googleId: string
  email: string
  displayName: string
  avatarUrl: string
  skinProfile?: ISkinProfile | null
  createdAt: Date
  updatedAt: Date
}

const skinProfileSchema = new Schema<ISkinProfile>(
  {
    skinType: {
      type: String,
      enum: ['oily', 'dry', 'sensitive', 'acne-prone'],
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    concerns: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
)

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: true,
    },
    skinProfile: {
      type: skinProfileSchema,
      default: null,
    },
  },
  { timestamps: true },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const User = (mongoose.models.User as any) || model<IUser>('User', userSchema)
