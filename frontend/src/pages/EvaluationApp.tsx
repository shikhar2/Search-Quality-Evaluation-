import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SingleEvaluation from '../components/SingleEvaluation'
import { SearchItem } from '../types'
import { useTheme } from '../hooks/useTheme'

const EvaluationApp = () => {
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()
  const [prefillItem, setPrefillItem] = useState<SearchItem | null>(null)

  useEffect(() => {
    const state = location.state as { item?: SearchItem } | undefined
    
    if (state?.item) {
      setPrefillItem(state.item)
      localStorage.setItem('currentEvaluationItem', JSON.stringify(state.item))
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      const storedItem = localStorage.getItem('currentEvaluationItem')
      if (storedItem) {
        try {
          setPrefillItem(JSON.parse(storedItem))
        } catch (error) {
          localStorage.removeItem('currentEvaluationItem')
        }
      }
    }
  }, [location])

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme}
          apiHealth="healthy"
          showBackButton={true}
        />
        
        <main className="px-4 py-8 md:px-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Single Item Evaluation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {prefillItem 
                  ? `Evaluating: ${prefillItem.item_title}` 
                  : 'Evaluate search relevance for a single item'
                }
              </p>
            </div>

            {/* Single Evaluation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
              <SingleEvaluation prefillItem={prefillItem} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EvaluationApp
