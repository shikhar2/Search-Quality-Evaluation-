import { useState } from 'react'
import SingleEvaluation from './SingleEvaluation'
import BatchEvaluation from './BatchEvaluation'
import { SearchItem } from '../types'

interface EvaluationTabsProps {
  prefillItem?: SearchItem | null
}

const EvaluationTabs = ({ prefillItem }: EvaluationTabsProps) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')

  // If prefillItem exists, show single evaluation tab
  const effectiveTab = prefillItem ? 'single' : activeTab

  return (
    <div className="glassmorphism rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
            effectiveTab === 'single'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <i className="fas fa-file-alt mr-2"></i>
          Single Evaluation
          {prefillItem && (
            <span className="ml-2 px-2 py-0.5 bg-green-400 text-white text-xs rounded-full">
              Prefilled
            </span>
          )}
        </button>

        <button
          onClick={() => {
            if (!prefillItem) {
              setActiveTab('batch')
            }
          }}
          disabled={!!prefillItem}
          className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
            effectiveTab === 'batch'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : prefillItem
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <i className="fas fa-list mr-2"></i>
          Batch Evaluation
          {prefillItem && (
            <span className="ml-2 text-xs">(Complete single first)</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 md:p-8">
        {effectiveTab === 'single' ? (
          <SingleEvaluation prefillItem={prefillItem} />
        ) : (
          <BatchEvaluation />
        )}
      </div>

      {/* Help Text */}
      {prefillItem && (
        <div className="px-6 pb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-1"></i>
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Prefilled Item:</strong> Complete this evaluation first, then you can access batch evaluation mode.
                <br />
                <span className="text-xs opacity-75">Clear or submit this form to enable batch mode</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluationTabs
