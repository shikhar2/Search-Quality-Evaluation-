import { useState, useCallback, useEffect } from 'react'
import { getSampleData } from '../data/sampleData'
import { SearchItem } from '../types'

/**
 * Generic localStorage hook with persistent state
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) return JSON.parse(item)

      const defaultValue =
        key === 'searchItems' ? (getSampleData() as T) : initialValue

      localStorage.setItem(key, JSON.stringify(defaultValue))
      return defaultValue
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const resetValue = () => {
    try {
      const defaultValue =
        key === 'searchItems' ? (getSampleData() as T) : initialValue

      const freshValue = JSON.parse(JSON.stringify(defaultValue))

      localStorage.removeItem(key)
      localStorage.setItem(key, JSON.stringify(freshValue))
      setStoredValue(freshValue)

      console.log(`✅ LocalStorage for "${key}" has been reset.`)
    } catch (error) {
      console.error(`Error resetting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, resetValue] as const
}

/**
 * Hook for managing search items with claim functionality
 * This is what LandingPage needs!
 */
export function useLocalData() {
  const [items, setItems, resetItems] = useLocalStorage<SearchItem[]>('searchItems', [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check if we have data
        const storedData = localStorage.getItem('searchItems')
        if (!storedData) {
          // Initialize with sample data
          const sampleData = getSampleData()
          localStorage.setItem('searchItems', JSON.stringify(sampleData))
          setItems(sampleData)
        }
        
        console.log('✅ Data loaded:', items.length, 'items')
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [])

  // Claim an item
  const claimItem = useCallback(async (itemId: number): Promise<SearchItem | null> => {
    try {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            claimed: true,
            claimed_at: new Date().toISOString()
          }
        }
        return item
      })

      setItems(updatedItems)
      
      const claimedItem = updatedItems.find(item => item.id === itemId)
      console.log(`✅ Item ${itemId} claimed`)
      
      return claimedItem || null
    } catch (error) {
      console.error('Claim failed:', error)
      return null
    }
  }, [items, setItems])

  // Unclaim an item
  const unclaimItem = useCallback(async (itemId: number): Promise<SearchItem | null> => {
    try {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            claimed: false,
            claimed_at: undefined
          }
        }
        return item
      })

      setItems(updatedItems)
      
      const unclaimedItem = updatedItems.find(item => item.id === itemId)
      console.log(`✅ Item ${itemId} unclaimed`)
      
      return unclaimedItem || null
    } catch (error) {
      console.error('Unclaim failed:', error)
      return null
    }
  }, [items, setItems])

  // Reset all claims
  const resetClaims = useCallback(async (): Promise<number> => {
    try {
      let unclaimedCount = 0
      
      const updatedItems = items.map(item => {
        if (item.claimed) {
          unclaimedCount++
          return {
            ...item,
            claimed: false,
            claimed_at: undefined
          }
        }
        return item
      })

      setItems(updatedItems)
      console.log(`✅ Reset ${unclaimedCount} claims`)
      
      return unclaimedCount
    } catch (error) {
      console.error('Reset claims failed:', error)
      return 0
    }
  }, [items, setItems])

  // Reset database to sample data
  const resetDatabase = useCallback(() => {
    resetItems()
    console.log('✅ Database reset to sample data')
  }, [resetItems])

  // Get statistics
  const getStats = useCallback(() => {
    const total = items.length
    const available = items.filter(item => !item.claimed).length
    const claimed = total - available

    return {
      total_items: total,
      available_items: available,
      claimed_items: claimed,
      total_evaluations: 0,
      average_score: 0
    }
  }, [items])

  return {
    data: items,
    items, // Alias
    loading,
    error,
    claimItem,
    unclaimItem,
    resetClaims,
    resetDatabase,
    getStats,
    setItems
  }
}

// Export both hooks
export default useLocalStorage
