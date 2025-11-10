import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export const Button: React.FC<ButtonProps> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${className}`}
  >
    {children}
  </button>
)
