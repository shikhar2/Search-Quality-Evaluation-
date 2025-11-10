import { FC } from 'react'
import { EvaluationResult } from '../types'
import { getScoreColor, getScoreLabel } from '../utils/helpers'

interface ResultCardProps {
  result: EvaluationResult
  query: string
  itemTitle: string
  prefilled?: boolean
  itemAttributes?: Record<string, any>
}

const ResultCard: FC<ResultCardProps> = ({ 
  result, 
  query, 
  itemTitle, 
  prefilled = false,
  itemAttributes 
}) => {
  const scoreColor = getScoreColor(result.relevance_score)
  const scoreLabel = getScoreLabel(result.relevance_score)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 dark:text-emerald-400'
    if (confidence >= 0.6) return 'text-blue-600 dark:text-blue-400'
    if (confidence >= 0.4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(0)}%`
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Relevance Score */}
        <div className="glassmorphism rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
              result.relevance_score >= 0.8 ? 'bg-emerald-500' :
              result.relevance_score >= 0.6 ? 'bg-blue-500' :
              result.relevance_score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <i className="fas fa-star text-lg"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {result.relevance_score.toFixed(2)}
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Relevance Score
              </div>
            </div>
          </div>
          
          {/* Score Progress Ring */}
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200 dark:text-gray-700"
                fill="none"
                strokeWidth="3"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`fill-none stroke-[3] ${
                  scoreColor.includes('green') ? 'stroke-emerald-500' :
                  scoreColor.includes('yellow') ? 'stroke-yellow-500' :
                  scoreColor.includes('orange') ? 'stroke-orange-500' : 'stroke-red-500'
                }`}
                strokeLinecap="round"
                strokeLinejoin="round"
                d={`M18 2.0845 a 15.9155 15.9155 0 0 1 ${result.relevance_score * 31.831} 0 a 15.9155 15.9155 0 0 1 -${result.relevance_score * 31.831} 0`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-sm font-bold ${scoreColor}`}>
                {scoreLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="glassmorphism rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-bullseye text-lg"></i>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                {formatConfidence(result.confidence)}
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                AI Confidence
              </div>
            </div>
          </div>
          
          {/* Confidence Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`
                  h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out rounded-full
                  ${getConfidenceColor(result.confidence).includes('emerald') ? 'from-emerald-500 to-emerald-600' :
                   getConfidenceColor(result.confidence).includes('yellow') ? 'from-yellow-500 to-yellow-600' :
                   getConfidenceColor(result.confidence).includes('red') ? 'from-red-500 to-red-600' : ''}
                `}
                style={{ width: `${result.confidence * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <span className={`text-sm font-medium ${
              result.confidence >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' :
              result.confidence >= 0.6 ? 'text-blue-600 dark:text-blue-400' :
              result.confidence >= 0.4 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {result.confidence >= 0.8 ? 'Very High' : 
               result.confidence >= 0.6 ? 'High' : 
               result.confidence >= 0.4 ? 'Medium' : 'Low'} Confidence
            </span>
          </div>
        </div>

        {/* Reason Code */}
        <div className="glassmorphism rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-info-circle text-lg"></i>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize">
                {result.reason_code.toLowerCase().replace('_', ' ')}
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Analysis Category
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-sm text-purple-700 dark:text-purple-300">
              <i className="fas fa-lightbulb"></i>
              <span>{getReasonDescription(result.reason_code)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Section */}
      <div className="glassmorphism rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <i className="fas fa-brain text-lg"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              🤖 AI Analysis & Reasoning
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                Detailed Explanation
              </span>
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className={`text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap ${
                result.ai_reasoning.length > 300 ? 'line-clamp-4' : ''
              }`}>
                {result.ai_reasoning || 'No detailed reasoning provided by AI model.'}
              </p>
              
              {result.ai_reasoning && result.ai_reasoning.length > 300 && (
                <button className="mt-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                  <i className="fas fa-expand"></i>
                  Read Full Analysis
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Context Information (if prefilled) */}
        {prefilled && itemAttributes && (
          <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h5 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              Original Item Context
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(itemAttributes).map(([key, value]) => (
                <div key={key} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {typeof value === 'boolean' 
                      ? value ? <span className="text-green-600">✓ Yes</span> : <span className="text-red-600">✗ No</span>
                      : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Summary */}
      <div className="glassmorphism rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {result.relevance_score.toFixed(3)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
              Final Score
            </div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
              scoreColor.includes('green') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
              scoreColor.includes('blue') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              scoreColor.includes('yellow') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {scoreLabel}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
              {formatConfidence(result.confidence)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
              Model Confidence
            </div>
            <div className="text-xs">
              {result.confidence >= 0.8 ? 'Very reliable prediction' :
               result.confidence >= 0.6 ? 'Reliable prediction' :
               result.confidence >= 0.4 ? 'Moderate confidence' : 'Lower confidence - review carefully'}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 capitalize">
              {result.reason_code.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
              Primary Reason
            </div>
            <div className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
              {getReasonCodeBadge(result.reason_code)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for reason descriptions
const getReasonDescription = (reasonCode: string): string => {
  const descriptions: Record<string, string> = {
    'excellent': 'Perfect match - highly relevant',
    'good': 'Strong relevance with good alignment',
    'fair': 'Moderate relevance, some alignment issues',
    'poor': 'Low relevance, significant mismatches',
    'irrelevant': 'No meaningful connection to query',
    'informational': 'Provides useful context but not direct match',
    'partial': 'Partially matches but missing key aspects',
    'technical': 'Matches technical specifications well',
    'brand_specific': 'Strong brand and model alignment',
    'price_sensitive': 'Price and value proposition alignment',
    'default': 'Standard evaluation criteria applied'
  }
  
  return descriptions[reasonCode.toLowerCase()] || descriptions.default
}

// Helper function for reason code badges
const getReasonCodeBadge = (reasonCode: string): string => {
  const badges: Record<string, string> = {
    'excellent': '⭐ Excellent',
    'good': '✅ Good', 
    'fair': '⚠️ Fair',
    'poor': '⚡ Poor',
    'irrelevant': '🚫 Irrelevant',
    'informational': 'ℹ️ Informational',
    'partial': '↔️ Partial',
    'technical': '🔧 Technical',
    'brand_specific': '🏷️ Brand Match',
    'price_sensitive': '💰 Price Match',
    'default': '📊 Standard'
  }
  
  return badges[reasonCode.toLowerCase()] || '📊 Analysis'
}

export default ResultCard
