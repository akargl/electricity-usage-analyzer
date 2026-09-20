import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('introduces the private CSV import workflow', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /analyze your power/i })).toBeInTheDocument()
    expect(screen.getByText(/drop csv files here/i)).toBeInTheDocument()
    expect(screen.getByText(/all data is processed locally/i)).toBeInTheDocument()
  })
})
