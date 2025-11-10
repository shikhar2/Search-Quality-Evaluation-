import { useState, useEffect } from 'react'
import { HistoryItem } from '../types'

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem('evaluationHistory')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    localStorage.setItem('evaluationHistory', JSON.stringify(history))
  }, [history])

  const addToHistory = (item: Omit<HistoryItem, 'id'>) => {
    setHistory(prev => [{ ...item, id: Date.now() }, ...prev].slice(0, 50))
  }

  const clearHistory = () => setHistory([])

  return { history, addToHistory, clearHistory }
}
