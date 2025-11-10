import { useState } from 'react'

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [subtext, setSubtext] = useState('')

  const showLoading = (msg: string, sub: string = '') => {
    setMessage(msg)
    setSubtext(sub)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
    setMessage('')
    setSubtext('')
  }

  return { isLoading, message, subtext, showLoading, hideLoading }
}
