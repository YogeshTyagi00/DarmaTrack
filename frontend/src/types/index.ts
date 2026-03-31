export interface SkinProfile {
  skinType: 'oily' | 'dry' | 'sensitive' | 'acne-prone'
  age: number
  concerns: string[]
  allergies: string[]
}

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  skinProfile: SkinProfile | null
}

export interface Analysis {
  id: string
  _id?: string
  status: 'pending' | 'processing' | 'completed' | 'unreadable' | 'failed'
  imageUrl: string
  ingredients: string[]
  rating: number | null
  explanation: string | null
  createdAt: string
}
