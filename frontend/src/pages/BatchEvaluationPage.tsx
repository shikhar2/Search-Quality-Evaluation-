import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluateBatch } from '../utils/api'
import { useToast } from '../hooks/useToast'
import { useLoading } from '../hooks/useLoading'
import { exportToJSON, exportToCSV, validateBatchInput } from '../utils/helpers'
import Navbar from '../components/Navbar'
import { useTheme } from '../hooks/useTheme'

interface BatchEvaluationResult {
  query: string
  item_title: string
  item_description: string
  item_category: string
  relevance_score: number
  confidence: number
  reason_code: string
  ai_reasoning?: string
}

const SAMPLE_BATCH_DATA = [
  {
    query: "red running shoes",
    item_title: "Nike Air Zoom Pegasus 39",
    item_description: "Experience ultimate comfort and performance with these vibrant red running shoes. Featuring advanced Zoom Air technology for responsive cushioning, breathable mesh upper, and durable rubber outsole for excellent traction on various surfaces.",
    item_category: "Footwear",
    item_attributes: { color: "red", size: "9", brand: "Nike", price: "$129.99" }
  },
  {
    query: "wireless bluetooth headphones",
    item_title: "Sony WH-1000XM4",
    item_description: "Premium wireless noise-canceling headphones with 30-hour battery life, quick charge, and crystal clear sound quality. Perfect for travel, work, and entertainment.",
    item_category: "Electronics",
    item_attributes: { color: "black", battery_life: "30 hours", price: "$349.99" }
  },
  {
    query: "professional laptop",
    item_title: "Dell XPS 13",
    item_description: "Ultra-slim professional laptop with 13.3-inch InfinityEdge display, 11th Gen Intel Core i7, 16GB RAM, and 512GB SSD. Perfect for business and creative work.",
    item_category: "Electronics",
    item_attributes: { processor: "Intel Core i7", ram: "16GB", price: "$1,299.99" }
  }
]

const BatchEvaluationPage = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [batchInput, setBatchInput] = useState('')
  const [results, setResults] = useState<BatchEvaluationResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'title'>('score')

  const handleEvaluate = async () => {
    const validation = validateBatchInput(batchInput)
    if (!validation.valid) {
      addToast(validation.error || 'Invalid JSON input', 'error')
      return
    }

    setIsEvaluating(true)
    showLoading('Processing batch evaluation...')
    
    try {
      const items = JSON.parse(batchInput)
      
      if (!Array.isArray(items)) {
        throw new Error('Input must be an array of items')
      }

      if (items.length === 0) {
        throw new Error('No items to evaluate')
      }

      if (items.length > 100) {
        addToast('Processing first 100 items only', 'warning')
      }

      const evalResults = await evaluateBatch(items.slice(0, 100))
      
      setResults(evalResults)
      addToast(`✅ Successfully evaluated ${evalResults.length} items!`, 'success')
      
    } catch (error) {
      console.error('Batch evaluation error:', error)
      addToast(
        error instanceof Error ? error.message : 'Batch evaluation failed',
        'error'
      )
    } finally {
      setIsEvaluating(false)
      hideLoading()
    }
  }

  const handleLoadSample = () => {
    setBatchInput(JSON.stringify(SAMPLE_BATCH_DATA, null, 2))
    addToast('Sample data loaded', 'info')
  }

  const handleClear = () => {
    if (confirm('Clear all data including results?')) {
      setBatchInput('')
      setResults([])
      setSearchTerm('')
      setFilterCategory('all')
      addToast('All data cleared', 'info')
    }
  }

  const handleFormatJSON = () => {
    try {
      const parsed = JSON.parse(batchInput)
      setBatchInput(JSON.stringify(parsed, null, 2))
      addToast('JSON formatted', 'success')
    } catch (error) {
      addToast('Invalid JSON - cannot format', 'error')
    }
  }

  // Get unique categories from results
  const categories = Array.from(new Set(results.map(r => r.item_category)))

  // Filter and sort results
  const filteredResults = results
    .filter(r => {
      const matchesSearch = !searchTerm ||
        r.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason_code.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === 'all' || r.item_category === filterCategory

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.relevance_score - a.relevance_score
      if (sortBy === 'confidence') return b.confidence - a.confidence
      return a.item_title.localeCompare(b.item_title)
    })

  // Calculate statistics
  const stats = results.length > 0 ? {
    total: results.length,
    avgScore: (results.reduce((sum, r) => sum + r.relevance_score, 0) / results.length).toFixed(3),
    avgConfidence: (results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100).toFixed(1),
    excellent: results.filter(r => r.relevance_score >= 0.8).length,
    good: results.filter(r => r.relevance_score >= 0.6 && r.relevance_score < 0.8).length,
    fair: results.filter(r => r.relevance_score >= 0.4 && r.relevance_score < 0.6).length,
    poor: results.filter(r => r.relevance_score < 0.4).length
  } : null

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        {/* Navbar */}
        <Navbar 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme}
          apiHealth="healthy"
          showBackButton={true}
        />

        {/* Main Content */}
        <main className="px-4 py-8 md:px-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                <i className="fas fa-layer-group text-3xl text-white"></i>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Batch Evaluation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Evaluate multiple search items at once. Upload your JSON data and get AI-powered relevance scores for all items in bulk.
              </p>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Evaluated</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{stats.excellent}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Excellent (≥0.8)</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{stats.avgScore}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{stats.avgConfidence}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-code text-blue-600"></i>
                  JSON Input
                </h3>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <i className={`fas fa-${showHelp ? 'chevron-up' : 'question-circle'} mr-1`}></i>
                  {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
              </div>

              {showHelp && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Batch Input Format
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    Paste a JSON array of items. Each item must have:
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1 mb-3">
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">query</code> - Search query string</li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_title</code> - Product/item title</li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_description</code> - Detailed description</li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_category</code> - Category name</li>
                    <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_attributes</code> - Additional attributes (optional)</li>
                  </ul>
                  <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 p-2 rounded">
                    <strong>💡 Tip:</strong> Click "Load Sample" to see a valid example. Maximum 100 items per batch.
                  </div>
                </div>
              )}

              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={16}
                placeholder='[{"query": "...", "item_title": "...", "item_description": "...", "item_category": "...", "item_attributes": {...}}]'
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                disabled={isEvaluating}
              />

              {/* Input Stats */}
              {batchInput.trim() && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>Characters: {batchInput.length.toLocaleString()}</span>
                  <span>Lines: {batchInput.split('\n').length}</span>
                  {(() => {
                    try {
                      const parsed = JSON.parse(batchInput)
                      return Array.isArray(parsed) ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ✓ Valid JSON - {parsed.length} items
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">✗ Not an array</span>
                      )
                    } catch {
                      return <span className="text-red-600 dark:text-red-400">✗ Invalid JSON</span>
                    }
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={handleLoadSample}
                  disabled={isEvaluating}
                  className="btn-secondary flex items-center gap-2"
                >
                  <i className="fas fa-magic"></i>
                  Load Sample ({SAMPLE_BATCH_DATA.length} items)
                </button>

                <button
                  onClick={handleFormatJSON}
                  disabled={isEvaluating || !batchInput.trim()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <i className="fas fa-align-left"></i>
                  Format JSON
                </button>

                <button
                  onClick={handleClear}
                  disabled={isEvaluating}
                  className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <i className="fas fa-trash"></i>
                  Clear All
                </button>

                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !batchInput.trim()}
                  className="btn-primary flex items-center gap-2 ml-auto"
                >
                  {isEvaluating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket"></i>
                      Evaluate Batch
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            {results.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                {/* Results Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i className="fas fa-chart-bar text-green-600"></i>
                        Evaluation Results
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                          {filteredResults.length} / {results.length}
                        </span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                      {/* Search */}
                      <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                          type="text"
                          placeholder="Search results..."
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Category Filter */}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      {/* Sort */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      >
                        <option value="score">Sort by Score</option>
                        <option value="confidence">Sort by Confidence</option>
                        <option value="title">Sort by Title</option>
                      </select>

                      {/* Export Buttons */}
                      <button
                        onClick={() => exportToJSON(results, 'batch_evaluation_results')}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <i className="fas fa-download"></i>
                        JSON
                      </button>

                      <button
                        onClick={() => exportToCSV(results, 'batch_evaluation_results')}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <i className="fas fa-file-csv"></i>
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Excellent</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Good</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.fair}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Fair</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.poor}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Poor</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {filteredResults.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                      <p>No results match your filters</p>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setFilterCategory('all')
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredResults.map((result, index) => (
                        <div
                          key={index}
                          className={`
                            bg-gradient-to-r rounded-lg p-4 border-l-4 transition-all hover:shadow-md
                            ${result.relevance_score >= 0.8 
                              ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500' 
                              : result.relevance_score >= 0.6
                              ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-500'
                              : result.relevance_score >= 0.4
                              ? 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-500'
                              : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-500'
                            }
                          `}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                  #{index + 1}
                                </span>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {result.item_title}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <i className="fas fa-search text-xs"></i>
                                <span>"{result.query}"</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className={`
                                px-4 py-2 rounded-lg font-bold text-lg shadow-md
                                ${result.relevance_score >= 0.8 
                                  ? 'bg-green-500 text-white' 
                                  : result.relevance_score >= 0.6
                                  ? 'bg-blue-500 text-white'
                                  : result.relevance_score >= 0.4
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                                }
                              `}>
                                {result.relevance_score.toFixed(3)}
                              </div>
                              <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                {result.reason_code}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                              <strong className="ml-2 text-gray-900 dark:text-white">
                                {(result.confidence * 100).toFixed(1)}%
                              </strong>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Category:</span>
                              <strong className="ml-2 text-gray-900 dark:text-white">
                                {result.item_category}
                              </strong>
                            </div>
                          </div>

                          {result.ai_reasoning && (
                            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded p-3 italic">
                              <i className="fas fa-quote-left text-xs opacity-50 mr-1"></i>
                              {result.ai_reasoning}
                              <i className="fas fa-quote-right text-xs opacity-50 ml-1"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !batchInput.trim() && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Evaluations Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Load sample data or paste your own JSON to get started
                </p>
                <button onClick={handleLoadSample} className="btn-primary">
                  <i className="fas fa-magic mr-2"></i>
                  Load Sample Data
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default BatchEvaluationPage
