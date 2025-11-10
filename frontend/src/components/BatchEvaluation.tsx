import { useState } from 'react'
import { evaluateBatch } from '../utils/api'
import { useToast } from '../hooks/useToast'
import { useLoading } from '../hooks/useLoading'
import { exportToJSON, exportToCSV, validateBatchInput } from '../utils/helpers'

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
    item_attributes: { color: "black", battery_life: "30 hours", noise_cancelling: true, price: "$349.99" }
  },
  {
    query: "professional laptop",
    item_title: "Dell XPS 13",
    item_description: "Ultra-slim professional laptop with 13.3-inch InfinityEdge display, 11th Gen Intel Core i7, 16GB RAM, and 512GB SSD. Perfect for business and creative work.",
    item_category: "Electronics",
    item_attributes: { processor: "Intel Core i7", ram: "16GB", storage: "512GB SSD", price: "$1,299.99" }
  }
]

const BatchEvaluation = () => {
  const { addToast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [batchInput, setBatchInput] = useState('')
  const [results, setResults] = useState<BatchEvaluationResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleEvaluate = async () => {
    // Validate input
    const validation = validateBatchInput(batchInput)
    if (!validation.valid) {
      addToast(validation.error || 'Invalid JSON input. Please check format.', 'error')
      return
    }

    setIsEvaluating(true)
    showLoading('Processing batch evaluation...')
    
    try {
      const items = JSON.parse(batchInput)
      
      // Validate array
      if (!Array.isArray(items)) {
        throw new Error('Input must be an array of items')
      }

      if (items.length === 0) {
        throw new Error('No items to evaluate')
      }

      if (items.length > 50) {
        addToast('Maximum 50 items allowed per batch. Processing first 50...', 'warning')
      }

      // Call batch evaluation API
      const evalResults = await evaluateBatch(items.slice(0, 50))
      
      setResults(evalResults)
      addToast(`✅ Successfully evaluated ${evalResults.length} items!`, 'success')
      
      // Calculate summary stats
      const avgScore = evalResults.reduce((sum, r) => sum + r.relevance_score, 0) / evalResults.length
      const excellentCount = evalResults.filter(r => r.relevance_score >= 0.8).length
      
      console.log('Batch evaluation summary:', {
        total: evalResults.length,
        average_score: avgScore.toFixed(3),
        excellent_count: excellentCount
      })
      
    } catch (error) {
      console.error('Batch evaluation error:', error)
      addToast(
        error instanceof Error ? error.message : 'Batch evaluation failed. Please check your input.',
        'error'
      )
    } finally {
      setIsEvaluating(false)
      hideLoading()
    }
  }

  const handleLoadSample = () => {
    setBatchInput(JSON.stringify(SAMPLE_BATCH_DATA, null, 2))
    addToast('Sample data loaded. Click "Evaluate Batch" to process.', 'info')
  }

  const handleClear = () => {
    setBatchInput('')
    setResults([])
    setSearchTerm('')
    addToast('Cleared all data', 'info')
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

  // Filter results
  const filteredResults = results.filter(r =>
    !searchTerm ||
    r.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="space-y-6">
      {/* Input Section */}
      <div className="glassmorphism rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i className="fas fa-list-check text-blue-600"></i>
            Batch Input
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <i className={`fas fa-${showAdvanced ? 'chevron-up' : 'chevron-down'} mr-1`}></i>
            {showAdvanced ? 'Hide' : 'Show'} Help
          </button>
        </div>

        {showAdvanced && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              <i className="fas fa-info-circle mr-1"></i>
              Batch Input Format
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              Paste a JSON array of items to evaluate. Each item must have:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1 mb-2">
              <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">query</code> - Search query string</li>
              <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_title</code> - Product/item title</li>
              <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_description</code> - Detailed description</li>
              <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_category</code> - Category name</li>
              <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">item_attributes</code> - Additional attributes (optional)</li>
            </ul>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              💡 Tip: Click "Load Sample" to see a valid example format
            </p>
          </div>
        )}

        <textarea
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          rows={14}
          placeholder='[{"query": "...", "item_title": "...", "item_description": "...", "item_category": "...", "item_attributes": {...}}]'
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          disabled={isEvaluating}
        />

        <div className="flex flex-wrap gap-3 mt-4">
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
            disabled={isEvaluating || (!batchInput.trim() && results.length === 0)}
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
                <i className="fas fa-play"></i>
                Evaluate Batch
              </>
            )}
          </button>
        </div>

        {/* Character/Line Count */}
        {batchInput.trim() && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
            <span>Characters: {batchInput.length}</span>
            <span>Lines: {batchInput.split('\n').length}</span>
            {(() => {
              try {
                const parsed = JSON.parse(batchInput)
                return Array.isArray(parsed) ? <span className="text-green-600 dark:text-green-400">✓ Valid JSON - {parsed.length} items</span> : <span className="text-red-600">✗ Not an array</span>
              } catch {
                return <span className="text-red-600">✗ Invalid JSON</span>
              }
            })()}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="glassmorphism rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Results Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-chart-bar text-green-600"></i>
                  Evaluation Results
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                    {results.length} items
                  </span>
                </h3>
                {stats && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Avg Score: <strong>{stats.avgScore}</strong> | 
                    Avg Confidence: <strong>{stats.avgConfidence}%</strong>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  placeholder="Search results..."
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <button
                  onClick={() => exportToJSON(results, 'batch_evaluation_results')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  Export JSON
                </button>

                <button
                  onClick={() => exportToCSV(results, 'batch_evaluation_results')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <i className="fas fa-file-csv"></i>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Excellent (≥0.8)</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Good (0.6-0.8)</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.fair}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Fair (0.4-0.6)</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.poor}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Poor (0-0.4)</div>
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                <p>No results match your search "{searchTerm}"</p>
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
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {result.item_title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <i className="fas fa-search text-xs"></i>
                          <span>"{result.query}"</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`
                          px-4 py-2 rounded-lg font-bold text-lg
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
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="fas fa-inbox text-6xl mb-4 opacity-30"></i>
          <h3 className="text-xl font-semibold mb-2">No Evaluations Yet</h3>
          <p className="mb-4">Load sample data or paste your own JSON to get started</p>
          <button onClick={handleLoadSample} className="btn-primary">
            <i className="fas fa-magic mr-2"></i>
            Load Sample Data
          </button>
        </div>
      )}
    </div>
  )
}

export default BatchEvaluation
