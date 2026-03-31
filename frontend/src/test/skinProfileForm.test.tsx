import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SkinProfileForm from '../components/SkinProfileForm'

function renderForm(onSubmit = vi.fn()) {
  return render(<SkinProfileForm onSubmit={onSubmit} />)
}

describe('SkinProfileForm', () => {
  it('shows inline error for missing skinType when form is submitted', () => {
    renderForm()

    // Submit without filling anything
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(screen.getByText(/skin type is required/i)).toBeInTheDocument()
  })

  it('shows inline error for missing age when form is submitted', () => {
    renderForm()

    // Select skin type but leave age empty
    fireEvent.click(screen.getByRole('radio', { name: /oily/i }))
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(screen.getByText(/age is required/i)).toBeInTheDocument()
  })

  it('shows errors for both missing skinType and age', () => {
    renderForm()

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.length).toBeGreaterThanOrEqual(2)
  })

  it('does not call onSubmit when required fields are missing', () => {
    const onSubmit = vi.fn()
    renderForm(onSubmit)

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct values when all required fields are filled', () => {
    const onSubmit = vi.fn()
    renderForm(onSubmit)

    fireEvent.click(screen.getByRole('radio', { name: /dry/i }))
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      skinType: 'dry',
      age: 30,
      concerns: [],
      allergies: [],
    })
  })
})
