import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { evaluateSingle, generateProductImage } from '../utils/api'
import { EvaluationRequest, EvaluationResult, SearchItem } from '../types'
import { useToast } from '../hooks/useToast'
import { useLoading } from '../hooks/useLoading'
import { useHistory } from '../hooks/useHistory'
import { stringifyAttributes, parseAttributes } from '../utils/helpers'
import NewResultCard from './NewResultCard'
import ProductSidebar from './productSideBar'

interface SingleEvaluationProps {
  prefillItem?: SearchItem | null
}

const SingleEvaluation: React.FC<SingleEvaluationProps> = ({ prefillItem }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const { addToHistory } = useHistory()

  const navigationState = location.state as { item?: SearchItem; fromLanding?: boolean } | undefined
  const prefillData = prefillItem || navigationState?.item

  const [formData, setFormData] = useState<EvaluationRequest>({
    query: prefillData?.query || '',
    item_title: prefillData?.item_title || '',
    item_description: prefillData?.item_description || '',
    item_category: prefillData?.item_category || '',
    item_attributes: prefillData?.item_attributes || {}
  })

  const [attributesJson, setAttributesJson] = useState(
    prefillData?.item_attributes ? stringifyAttributes(prefillData.item_attributes) : ''
  )

  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [isResultLoading, setIsResultLoading] = useState(false)
  const [isPrefilled, setIsPrefilled] = useState(!!prefillData)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ✅ Prefill toast
  useEffect(() => {
    if (isPrefilled && prefillData) {
      const timer = setTimeout(() => {
        addToast(`📋 Form prefilled with "${prefillData.item_title}"`, 'success')
        setIsPrefilled(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isPrefilled, prefillData, addToast])

  // ✅ Auto-evaluate when form data is complete
  useEffect(() => {
    const requiredFilled =
      formData.query.trim() &&
      formData.item_title.trim() &&
      formData.item_description.trim() &&
      formData.item_category.trim()

    if (requiredFilled) {
      runEvaluation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  // ✅ Core evaluation logic
  const runEvaluation = async () => {
    if (result) return // avoid duplicate runs

    let attributes = formData.item_attributes
    if (attributesJson.trim()) {
      try {
        attributes = parseAttributes(attributesJson)
      } catch {
        addToast('❌ Invalid JSON format in attributes field', 'error')
        return
      }
    }

    const requestData: EvaluationRequest = { ...formData, item_attributes: attributes }

    // Show sidebar + loader
    setIsSidebarOpen(true)
    showLoading('🤖 Analyzing Search Relevance...', 'Running AI evaluation - this may take a few moments')

    try {
      setIsResultLoading(true)
      const [evalResult, imageUrl] = await Promise.all([
        evaluateSingle(requestData),
        generateProductImage(requestData),
      ])
      setResult({ ...evalResult, item_image: imageUrl })

      addToHistory({
        timestamp: new Date().toISOString(),
        query: requestData.query,
        itemTitle: requestData.item_title,
        itemDescription: requestData.item_description,
        itemCategory: requestData.item_category,
        itemAttributes: requestData.item_attributes,
        score: evalResult.relevance_score,
        confidence: evalResult.confidence,
        reasonCode: evalResult.reason_code,
        aiReasoning: evalResult.ai_reasoning,
        source: prefillData ? 'claimed_item' : 'manual_entry',
        itemId: prefillData?.id
      })

      addToast(
        prefillData
          ? `✅ "${requestData.item_title}" evaluated successfully!`
          : '🎉 Evaluation completed successfully!',
        'success'
      )

      if (prefillData) {
        localStorage.removeItem('currentEvaluationItem')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation failed unexpectedly'
      addToast(`❌ ${message}`, 'error')
      console.error('Evaluation error:', error)
    } finally {
      hideLoading()
      setIsResultLoading(false)
    }
  }

  // ✅ Handle field updates
  const handleFieldChange = (field: keyof EvaluationRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setResult(null)
  }

  const handleAttributesChange = (value: string) => {
    setAttributesJson(value)
    setResult(null)
    try {
      const parsed = parseAttributes(value)
      setFormData(prev => ({ ...prev, item_attributes: parsed }))
    } catch {
      // ignore parsing while typing
    }
  }

  const handleClearForm = () => {
    if (confirm('Clear all form data?')) {
      setFormData({
        query: '',
        item_title: '',
        item_description: '',
        item_category: '',
        item_attributes: {}
      })
      setAttributesJson('')
      setResult(null)
      setIsPrefilled(false)
      localStorage.removeItem('currentEvaluationItem')
      if (navigationState?.fromLanding) navigate(0)
      addToast('🧹 Form cleared successfully', 'info')
    }
  }

  const hasPrefilledData = !!(
    formData.query ||
    formData.item_title ||
    formData.item_description ||
    formData.item_category ||
    Object.keys(formData.item_attributes).length > 0
  )

  return (
    <div className="space-y-6">
      {/* Prefill Notification */}
      {hasPrefilledData && (
        <div
          className={`glassmorphism rounded-xl p-4 border-l-4 ${prefillData
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${prefillData ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
              >
                {prefillData ? '🎯' : '📋'}
              </div>
              <div>
                <h4 className="font-semibold">
                  {prefillData ? 'Auto-filled from Claimed Item' : 'Form Data Loaded'}
                </h4>
                {prefillData && (
                  <p className="text-sm opacity-90">Ready to evaluate "{prefillData.item_title}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {prefillData && (
                <button
                  onClick={() =>
                    setFormData({
                      query: prefillData.query,
                      item_title: prefillData.item_title,
                      item_description: prefillData.item_description,
                      item_category: prefillData.item_category,
                      item_attributes: prefillData.item_attributes
                    })
                  }
                  className="text-emerald-600 hover:text-emerald-800 text-sm px-3 py-1.5 rounded-lg bg-emerald-100"
                >
                  Refresh
                </button>
              )}
              <button
                onClick={handleClearForm}
                className="text-gray-600 hover:text-gray-800 text-sm px-3 py-1.5 rounded-lg bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 Evaluation Form */}
      <form className="space-y-6 glassmorphism p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label-text">Search Query *</label>
            <input
              type="text"
              className="input-field"
              value={formData.query}
              onChange={e => handleFieldChange('query', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-text">Item Title *</label>
            <input
              type="text"
              className="input-field"
              value={formData.item_title}
              onChange={e => handleFieldChange('item_title', e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="label-text">Description *</label>
            <textarea
              className="input-field min-h-[100px]"
              value={formData.item_description}
              onChange={e => handleFieldChange('item_description', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-text">Category *</label>
            <input
              type="text"
              className="input-field"
              value={formData.item_category}
              onChange={e => handleFieldChange('item_category', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-text">Attributes (JSON)</label>
            <input
              type="text"
              className="input-field font-mono"
              value={attributesJson}
              onChange={e => handleAttributesChange(e.target.value)}
              placeholder='{"color":"red","size":"10"}'
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearForm}
            className="btn-secondary py-3 px-6"
          >
            Clear
          </button>
        </div>
      </form>

      {/* 🧾 Results Section */}
      {isResultLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        result && (
          <NewResultCard
            result={result}
            query={formData.query}
            itemTitle={formData.item_title}
          />
        )
      )}

      {/* Product Sidebar */}
      <ProductSidebar
        query={formData.query}
        itemTitle={formData.item_title}
        itemCategory={formData.item_category}
      />

      {result && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed right-6 bottom-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center text-2xl z-30"
          title="Toggle Product Research"
        >
          {isSidebarOpen ? '✕' : '🔍'}
        </button>
      )}
    </div>
  )
}

export default SingleEvaluation
