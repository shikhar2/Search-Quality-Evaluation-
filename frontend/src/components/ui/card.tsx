import React, { ReactNode } from 'react'

interface CardProps {
  className?: string
  children?: ReactNode
}

export const Card: React.FC<CardProps> = ({ className = '', children }) => (
  <div className={`rounded-xl overflow-hidden ${className}`}>{children}</div>
)

interface CardContentProps {
  className?: string
  children?: ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({ className = '', children }) => (
  <div className={`p-4 ${className}`}>{children}</div>
)
