import { useState } from 'react'
import type { SkinProfile } from '../types'

interface SkinProfileFormProps {
  initialValues?: Partial<SkinProfile>
  onSubmit: (values: SkinProfile) => void
  isLoading?: boolean
}

const SKIN_TYPES: SkinProfile['skinType'][] = ['oily', 'dry', 'sensitive', 'acne-prone']

interface FormErrors {
  skinType?: string
  age?: string
}

export default function SkinProfileForm({ initialValues, onSubmit, isLoading }: SkinProfileFormProps) {
  const [skinType, setSkinType] = useState<SkinProfile['skinType'] | ''>(initialValues?.skinType ?? '')
  const [age, setAge] = useState<string>(initialValues?.age != null ? String(initialValues.age) : '')
  const [concerns, setConcerns] = useState<string[]>(initialValues?.concerns ?? [])
  const [allergies, setAllergies] = useState<string[]>(initialValues?.allergies ?? [])
  const [concernInput, setConcernInput] = useState('')
  const [allergyInput, setAllergyInput] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!skinType) errs.skinType = 'Skin type is required'
    if (!age.trim()) {
      errs.age = 'Age is required'
    } else if (isNaN(Number(age)) || Number(age) <= 0 || !Number.isInteger(Number(age))) {
      errs.age = 'Age must be a positive whole number'
    }
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit({
      skinType: skinType as SkinProfile['skinType'],
      age: Number(age),
      concerns,
      allergies,
    })
  }

  const addItem = (
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    const trimmed = input.trim()
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed])
    }
    setInput('')
  }

  const removeItem = (index: number, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Skin Type */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          Skin type <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SKIN_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                skinType === type
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-300 text-gray-700 hover:border-indigo-400'
              }`}
            >
              <input
                type="radio"
                name="skinType"
                value={type}
                checked={skinType === type}
                onChange={() => {
                  setSkinType(type)
                  if (errors.skinType) setErrors((e) => ({ ...e, skinType: undefined }))
                }}
                className="sr-only"
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
        {errors.skinType && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.skinType}
          </p>
        )}
      </fieldset>

      {/* Age */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
          Age <span className="text-red-500">*</span>
        </label>
        <input
          id="age"
          type="number"
          min={1}
          value={age}
          onChange={(e) => {
            setAge(e.target.value)
            if (errors.age) setErrors((err) => ({ ...err, age: undefined }))
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.age ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g. 28"
        />
        {errors.age && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.age}
          </p>
        )}
      </div>

      {/* Concerns */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skin concerns</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={concernInput}
            onChange={(e) => setConcernInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem(concernInput, setConcernInput, concerns, setConcerns)
              }
            }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. redness"
          />
          <button
            type="button"
            onClick={() => addItem(concernInput, setConcernInput, concerns, setConcerns)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Add
          </button>
        </div>
        {concerns.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {concerns.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(i, concerns, setConcerns)}
                  aria-label={`Remove ${item}`}
                  className="ml-1 text-indigo-400 hover:text-indigo-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem(allergyInput, setAllergyInput, allergies, setAllergies)
              }
            }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. fragrance"
          />
          <button
            type="button"
            onClick={() => addItem(allergyInput, setAllergyInput, allergies, setAllergies)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Add
          </button>
        </div>
        {allergies.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {allergies.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(i, allergies, setAllergies)}
                  aria-label={`Remove ${item}`}
                  className="ml-1 text-rose-400 hover:text-rose-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {isLoading ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
