import { BatchEvaluationResult } from '../types'

// ========== Date/Time Helpers ==========
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getRelativeTime = (timestamp: string): string => {
  const now = new Date().getTime()
  const past = new Date(timestamp).getTime()
  const diff = now - past

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return formatTimestamp(timestamp)
}

// ========== Score Helpers ==========
export const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400'
  if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 0.4) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

// ✅ MISSING FUNCTION - ADD THIS:
export const getScoreLabel = (score: number): string => {
  if (score >= 0.8) return 'Excellent'
  if (score >= 0.6) return 'Good'
  if (score >= 0.4) return 'Fair'
  return 'Poor'
}

export const getScoreBgColor = (score: number): string => {
  if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (score >= 0.4) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-emerald-600 dark:text-emerald-400'
  if (confidence >= 0.6) return 'text-blue-600 dark:text-blue-400'
  if (confidence >= 0.4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return 'Very High'
  if (confidence >= 0.6) return 'High'
  if (confidence >= 0.4) return 'Medium'
  return 'Low'
}

// ========== Export Helpers ==========
export const exportToJSON = (data: any, filename: string): void => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadFile(blob, `${filename}.json`)
}

export const exportToCSV = (data: BatchEvaluationResult[], filename: string): void => {
  const headers = [
    'Query',
    'Title', 
    'Description',
    'Category',
    'Score',
    'Confidence',
    'Reason Code',
    'AI Reasoning',
    'Timestamp'
  ]

  const rows = data.map(item => [
    `"${item.query.replace(/"/g, '""')}"`,
    `"${item.item_title.replace(/"/g, '""')}"`,
    `"${item.item_description.replace(/"/g, '""')}"`,
    `"${item.item_category}"`,
    item.relevance_score,
    item.confidence,
    `"${item.reason_code}"`,
    `"${item.ai_reasoning.replace(/"/g, '""')}"`,
    new Date().toISOString()
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${filename}.csv`)
}

const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ========== Validation Helpers ==========
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export const validateBatchInput = (input: string): { valid: boolean; error?: string } => {
  if (!input.trim()) {
    return { valid: false, error: 'Input cannot be empty' }
  }

  if (!isValidJSON(input)) {
    return { valid: false, error: 'Invalid JSON format' }
  }

  try {
    const data = JSON.parse(input)
    
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Input must be an array of items' }
    }

    if (data.length === 0) {
      return { valid: false, error: 'Array cannot be empty' }
    }

    // Validate each item has required fields
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const required = ['query', 'item_title', 'item_description', 'item_category']
      
      for (const field of required) {
        if (!item[field] || typeof item[field] !== 'string') {
          return { valid: false, error: `Item ${i + 1}: Missing or invalid field "${field}"` }
        }
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Failed to validate input structure' }
  }
}

// ========== Category Helpers ==========
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Footwear': 'border-l-red-500 bg-red-100/80',
    'Electronics': 'border-l-blue-500 bg-blue-100/80',
    'Clothing': 'border-l-purple-500 bg-purple-100/80',
    'Books': 'border-l-green-500 bg-green-100/80',
    'Home': 'border-l-orange-500 bg-orange-100/80',
    'Sports': 'border-l-indigo-500 bg-indigo-100/80',
    'Beauty': 'border-l-pink-500 bg-pink-100/80',
    'Food': 'border-l-yellow-500 bg-yellow-100/80',
    default: 'border-l-gray-500 bg-gray-100/80'
  }
  
  return colors[category] || colors.default
}

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Footwear': 'fa-shoe-prints',
    'Electronics': 'fa-plug',
    'Clothing': 'fa-tshirt',
    'Books': 'fa-book',
    'Home': 'fa-home',
    'Sports': 'fa-dumbbell',
    'Beauty': 'fa-magic',
    'Food': 'fa-utensils',
    default: 'fa-cube'
  }
  
  return icons[category] || icons.default
}

export const formatAttributes = (attributes: Record<string, any>): string => {
  return Object.entries(attributes)
    .map(([key, value]) => {
      const formattedValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No')
        : typeof value === 'number' && !isNaN(value)
        ? `$${value.toFixed(2)}`
        : String(value)
      
      return `${key}: ${formattedValue}`
    })
    .join(' | ')
}

// ========== Prefill Helpers ==========
export const stringifyAttributes = (attributes: Record<string, any>): string => {
  if (!attributes || typeof attributes !== 'object' || Object.keys(attributes).length === 0) {
    return ''
  }
  
  try {
    const jsonString = JSON.stringify(attributes, (key, value) => {
      // Handle special cases for serialization
      if (value === undefined) return null
      if (typeof value === 'function') return '[Function]'
      if (value instanceof Date) return value.toISOString()
      if (value === Infinity) return 'Infinity'
      if (value === -Infinity) return '-Infinity'
      if (Number.isNaN(value)) return 'NaN'
      
      return value
    }, 2)
    
    return jsonString
  } catch (error) {
    console.warn('Error stringifying attributes:', error)
    // Fallback to simple string format
    return Object.entries(attributes)
      .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
      .join(', ')
  }
}

export const parseAttributes = (jsonString: string): Record<string, any> => {
  if (!jsonString || !jsonString.trim()) {
    return {}
  }
  
  try {
    const parsed = JSON.parse(jsonString)
    
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
    
    return parseKeyValueString(jsonString)
  } catch (error) {
    console.warn('JSON parsing failed:', error)
    return parseKeyValueString(jsonString)
  }
}

const parseKeyValueString = (str: string): Record<string, any> => {
  const result: Record<string, any> = {}
  const pairs = str.split(',')
    .map(pair => pair.trim())
    .filter(pair => pair)
  
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = pair.substring(0, colonIndex).trim()
    const valueStr = pair.substring(colonIndex + 1).trim()
    
    if (!key) continue
    
    // Try to parse value intelligently
    let value: any = valueStr
    
    // Remove surrounding quotes
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      value = valueStr.slice(1, -1)
    }
    
    // Parse numbers
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      value = parseFloat(value)
    }
    // Parse booleans
    else if (value.toLowerCase() === 'true') {
      value = true
    }
    else if (value.toLowerCase() === 'false') {
      value = false
    }
    // Parse null
    else if (value.toLowerCase() === 'null') {
      value = null
    }
    
    result[key] = value
  }
  
  return result
}

export const cleanAttributesForAPI = (attributes: Record<string, any>): Record<string, any> => {
  if (!attributes || typeof attributes !== 'object') {
    return {}
  }
  
  const cleaned: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || typeof value === 'function') {
      continue
    }
    
    if (value instanceof Date) {
      cleaned[key] = value.toISOString()
    } else if (ArrayBuffer.isView(value)) {
      continue // Skip binary data
    } else {
      cleaned[key] = value
    }
  }
  
  return cleaned
}

// ========== Reason Code Helpers ==========
export const getReasonDescription = (reasonCode: string): string => {
  const descriptions: Record<string, string> = {
    'excellent': 'Perfect semantic match between query and item - highly relevant result',
    'good': 'Strong topical alignment with good keyword matching',
    'fair': 'Moderate relevance with some alignment but potential gaps',
    'poor': 'Low semantic connection with limited relevance',
    'irrelevant': 'No meaningful semantic relationship detected',
    'informational': 'Provides contextual information but not direct match',
    'partial': 'Partially matches query intent but misses key aspects',
    'technical': 'Strong technical specification alignment',
    'brand_specific': 'Excellent brand and model matching',
    'price_sensitive': 'Relevant for price-comparison queries',
    'seasonal': 'Good temporal or seasonal relevance',
    'location_based': 'Relevant for location-specific searches',
    'default': 'Standard relevance assessment applied'
  }
  
  return descriptions[reasonCode.toLowerCase().replace(/_/g, '')] || 
         descriptions.default
}

export const getReasonCodeBadge = (reasonCode: string): string => {
  const badges: Record<string, string> = {
    'excellent': '⭐ Excellent Match',
    'good': '✅ Good Relevance', 
    'fair': '⚠️ Fair Match',
    'poor': '⚡ Poor Relevance',
    'irrelevant': '🚫 Not Relevant',
    'informational': 'ℹ️ Informational',
    'partial': '↔️ Partial Match',
    'technical': '🔧 Technical Specs',
    'brand_specific': '🏷️ Brand Match',
    'price_sensitive': '💰 Price Match',
    'seasonal': '📅 Seasonal',
    'location_based': '📍 Location',
    'default': '📊 Standard Analysis'
  }
  
  const key = reasonCode.toLowerCase().replace(/_/g, '')
  return badges[key] || badges.default
}

// ========== Form Helpers ==========
export const getFieldValidationState = (value: string, required: boolean = false): 'valid' | 'invalid' | 'default' => {
  if (required && !value?.trim()) return 'invalid'
  if (value?.trim()) return 'valid'
  return 'default'
}

export const formatFieldLength = (value: string): string => {
  const length = value?.length || 0
  if (length === 0) return ''
  return `${length} ${length === 1 ? 'character' : 'characters'}`
}

// ========== UI Helpers ==========
export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// ========== API Helpers ==========
export const formatApiError = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

// Export everything for easy import
export * from './api'


