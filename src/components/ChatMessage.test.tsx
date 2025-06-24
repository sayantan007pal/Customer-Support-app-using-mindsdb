import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessageComponent } from './ChatMessage'

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const message = {
      id: '1',
      content: 'Hello, how can I help?',
      role: 'user' as const,
      timestamp: new Date('2025-06-24T12:00:00Z')
    }

    render(<ChatMessageComponent message={message} />)
    
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    const message = {
      id: '2',
      content: 'I can help you with your account questions.',
      role: 'assistant' as const,
      timestamp: new Date('2025-06-24T12:01:00Z')
    }

    render(<ChatMessageComponent message={message} />)
    
    expect(screen.getByText('I can help you with your account questions.')).toBeInTheDocument()
  })
})
