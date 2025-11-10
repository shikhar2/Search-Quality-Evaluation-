import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { SearchItem } from '../types'
import { Button } from '../components/ui/button'
import DataTable from '../components/DataTable'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  // Load items with reset function
  const [items, setItems, resetItems] = useLocalStorage<SearchItem[]>('searchItems', [])
  const [currentClaimedItem, setCurrentClaimedItem] = useState<SearchItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Restore current claimed item from localStorage
  useEffect(() => {
    const savedItem = localStorage.getItem('currentEvaluationItem')
    if (savedItem) {
      try {
        setCurrentClaimedItem(JSON.parse(savedItem))
      } catch (error) {
        console.error('Failed to parse saved item:', error)
        localStorage.removeItem('currentEvaluationItem')
      }
    }
  }, [])

  // 🆕 Auto-claim next available item
  const handleClaimNext = () => {
    // If there's already a claimed item, warn user
    if (currentClaimedItem) {
      const confirmed = window.confirm(
        `You are currently evaluating "${currentClaimedItem.item_title}". Do you want to switch to a new item?`
      )
      if (!confirmed) return
    }

    // Find first available (unclaimed) item
    const nextAvailableItem = items.find(item => !item.claimed)
    
    if (!nextAvailableItem) {
      alert('No available items to claim. All items have been claimed.')
      return
    }

    // Claim the item
    handleClaim(nextAvailableItem)
  }

  // Handle claim or continue (for clicked items from table)
  const handleClaim = (item: SearchItem) => {
    const isAlreadyClaimed = item.claimed

    // If already claimed → continue
    if (isAlreadyClaimed) {
      localStorage.setItem('currentEvaluationItem', JSON.stringify(item))
      navigate('/evaluate', { state: { item, fromLanding: true } })
      return
    }

    // If another is active → block (this is handled in handleClaimNext for auto-claim)
    if (currentClaimedItem && currentClaimedItem.item_title !== item.item_title) {
      const confirmed = window.confirm(
        `You are currently evaluating "${currentClaimedItem.item_title}". Do you want to switch to "${item.item_title}" instead?`
      )
      if (!confirmed) return
    }

    // Mark claimed
    const updatedItems = items.map((i) =>
      i.item_title === item.item_title
        ? { ...i, claimed: true, claimed_at: new Date().toISOString() }
        : i
    )
    setItems(updatedItems)
    setCurrentClaimedItem(item)
    localStorage.setItem('currentEvaluationItem', JSON.stringify(item))

    navigate('/evaluate', { state: { item, fromLanding: true } })
  }

  // Handle batch evaluation navigation
  const handleBatchEvaluate = () => {
    navigate('/batch')
  }

  // Extract claimed and available items
  const claimedItems = items.filter((item) => item.claimed)
  const availableItems = items.filter((item) => !item.claimed)

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.item_category)))

  // Filter claimed items (for search/filter in table)
  const filteredClaimedItems = claimedItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || item.item_category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // 🔄 Handle full reset using hook's built-in reset
  const handleReset = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all data? This will:\n' +
      '• Remove all claimed items\n' +
      '• Clear your progress\n' +
      '• Restore sample data\n\n' +
      'This action cannot be undone.'
    )
    if (!confirmed) return

    // Use resetValue() instead of manual removal
    resetItems()
    localStorage.removeItem('currentEvaluationItem')
    localStorage.removeItem('evaluationHistory')
    setCurrentClaimedItem(null)
    alert('✅ All evaluation data has been reset and sample items restored.')
  }

  // Statistics
  const stats = {
    total: items.length,
    available: availableItems.length,
    claimed: claimedItems.length,
    completion: items.length > 0 ? Math.round((claimedItems.length / items.length) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-database text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  SearchEval Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Local Storage Database
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm">
                  <i className="fas fa-inbox text-blue-500 mr-1"></i>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.available}</span>
                  <span className="text-gray-600 dark:text-gray-400"> Available</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-sm">
                  <i className="fas fa-check-circle text-green-500 mr-1"></i>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats.claimed}</span>
                  <span className="text-gray-600 dark:text-gray-400"> Claimed</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-sm">
                  <i className="fas fa-chart-pie text-purple-500 mr-1"></i>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{stats.completion}%</span>
                  <span className="text-gray-600 dark:text-gray-400"> Done</span>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleClaimNext}
                disabled={availableItems.length === 0}
                className={`
                  px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all
                  ${availableItems.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <i className="fas fa-hand-holding-heart"></i>
                Claim ({stats.available} available)
              </Button>

              <Button
                onClick={handleBatchEvaluate}
                className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-layer-group"></i>
                Batch Evaluate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">
        {/* 🌟 Hero Section */}
        <section className="relative bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 md:p-12 text-center overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
              <i className="fas fa-search text-3xl"></i>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-100">
              Search Evaluation Tool
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Evaluate search quality and relevance using local database storage. 
              Claim the next available product for evaluation or use batch mode for multiple items at once.
            </p>

            {currentClaimedItem && (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                <i className="fas fa-info-circle text-green-600 dark:text-green-400"></i>
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Currently Evaluating:
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {currentClaimedItem.item_title}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button
                onClick={handleClaimNext}
                disabled={availableItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-hand-holding-heart mr-2"></i>
                {availableItems.length > 0 
                  ? `Claim Next Item (${availableItems.length} available)` 
                  : 'No Items Available'
                }
              </Button>

              {currentClaimedItem && (
                <Button
                  onClick={() =>
                    navigate('/evaluate', { state: { item: currentClaimedItem, fromLanding: true } })
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  Continue Evaluation
                </Button>
              )}

              <Button
                onClick={handleBatchEvaluate}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <i className="fas fa-layer-group mr-2"></i>
                Batch Evaluate
              </Button>

              {/* 🔄 Reset Button */}
              <Button
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <i className="fas fa-undo-alt mr-2"></i>
                Reset All Data
              </Button>
            </div>
          </div>
        </section>

        {/* 📊 Claimed Items Section */}
        {claimedItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <i className="fas fa-history text-purple-600"></i>
                Claimed Products
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full">
                  {claimedItems.length}
                </span>
              </h2>

              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search claimed items..."
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {(searchTerm || categoryFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setCategoryFilter('all')
                    }}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Clear
                  </Button>
                )}

                <Button
                  onClick={() => navigate('/evaluate')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Go to Evaluation
                </Button>
              </div>
            </div>

            {filteredClaimedItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <i className="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'No claimed items match your filters' 
                    : 'No claimed items yet'
                  }
                </p>
              </div>
            ) : (
              <DataTable items={filteredClaimedItems} onClaim={handleClaim} />
            )}
          </section>
        )}

        {/* Help Section */}
        <section className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <i className="fas fa-question-circle text-blue-600"></i>
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-hand-holding-heart text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">1. Claim an Item</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Claim" to automatically get the next available item for evaluation
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-clipboard-check text-green-600 dark:text-green-400"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">2. Evaluate Quality</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review search relevance and provide detailed feedback
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-layer-group text-purple-600 dark:text-purple-400"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">3. Batch Process</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Evaluate multiple items at once using batch mode
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LandingPage
