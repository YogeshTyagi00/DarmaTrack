import mongoose, { Schema, model, Document, Types } from 'mongoose'

export interface IAnalysis extends Document {
  userId: Types.ObjectId
  imageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'unreadable' | 'failed'
  ingredients: string[]
  rating: number | null
  explanation: string | null
  createdAt: Date
  updatedAt: Date
}

const analysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'unreadable', 'failed'],
      required: true,
      default: 'pending',
    },
    ingredients: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: null,
    },
    explanation: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

export const Analysis =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mongoose.models.Analysis as any) ||
  model<IAnalysis>('Analysis', analysisSchema)
