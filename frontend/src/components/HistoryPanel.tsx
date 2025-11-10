import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import HistoryItem from './HistoryItem'

const HistoryPanel = () => {
  const { history, clearHistory } = useHistory()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (history.length === 0) return null

  return (
    <>
      <div className={`fixed right-8 top-24 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 transition-all ${
        isCollapsed ? 'w-16 h-16' : 'max-h-[70vh]'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <i className="fas fa-history"></i>
                Recent Evaluations
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <button
                  onClick={clearHistory}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-600 dark:text-gray-300"
            >
              <i className="fas fa-history"></i>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {history.slice(0, 10).map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default HistoryPanel
