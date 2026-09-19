import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('introduces the private CSV import workflow', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /see where yourenergy goes/i })).toBeInTheDocument()
    expect(screen.getByText(/drop csv files here/i)).toBeInTheDocument()
    expect(screen.getByText(/100% private/i)).toBeInTheDocument()
  })
})
