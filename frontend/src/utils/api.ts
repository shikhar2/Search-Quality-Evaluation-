import { EvaluationRequest, EvaluationResult, BatchEvaluationItem, BatchEvaluationResult } from '../types'

const API_BASE_URL = 'http://127.0.0.1:8000'

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return data.status === 'healthy'
  } catch {
    return false
  }
}

export const evaluateSingle = async (request: EvaluationRequest): Promise<EvaluationResult> => {
  const response = await fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Evaluation failed')
  }
  
  return response.json()
}

export const evaluateBatch = async (items: BatchEvaluationItem[]): Promise<BatchEvaluationResult[]> => {
  const response = await fetch(`${API_BASE_URL}/evaluate/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
  
  if (!response.ok) throw new Error('Batch evaluation failed')
  return response.json()
}
