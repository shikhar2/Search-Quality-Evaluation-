import { FC } from 'react'
import { SearchItem } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface NavbarProps {
  isDarkMode: boolean
  toggleTheme: () => void
  apiHealth: 'healthy' | 'unhealthy' | 'checking'
  showBackButton?: boolean
  prefillItem?: SearchItem | null
}

const Navbar: FC<NavbarProps> = ({
  isDarkMode,
  toggleTheme,
  apiHealth,
  showBackButton = false,
  prefillItem
}) => {
  // LocalStorage hook for searchItems
  const [, , resetSearchItems] = useLocalStorage<SearchItem[]>('searchItems', [])

  const healthConfig = {
    healthy: { icon: 'fa-circle-check', text: 'API Healthy', className: 'bg-green-500 text-white' },
    unhealthy: { icon: 'fa-exclamation-triangle', text: 'API Offline', className: 'bg-red-500 text-white animate-pulse' },
    checking: { icon: 'fa-circle-notch fa-spin', text: 'Checking...', className: 'bg-gray-400 text-white' },
  }

  const health = healthConfig[apiHealth]

  // Reset data handler
  const handleResetData = () => {
    if (window.confirm('Reset all sample data to defaults?')) {
      resetSearchItems()
      alert('✅ Sample data reset successfully!')
    }
  }

  return (
    <nav className="glassmorphism border-b sticky top-0 z-50 backdrop-blur-md bg-white/60 dark:bg-gray-900/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Left section: logo + back button */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Go back"
            >
              <i className="fas fa-arrow-left text-gray-700 dark:text-gray-200"></i>
            </button>
          )}

          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center text-white">
            <i className="fas fa-search"></i>
          </div>
          <span className="text-xl font-semibold">SearchEval</span>
        </div>

        {/* Middle section: optional prefill indicator */}
        {prefillItem && (
          <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 italic">
            Prefilled: <span className="font-medium">{prefillItem.item_title}</span>
          </div>
        )}

        {/* Right section: API health + theme toggle + reset */}
        <div className="flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${health.className}`}
          >
            <i className={`fas ${health.icon} text-xs`}></i>
            <span className="text-sm">{health.text}</span>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetData}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            title="Reset all data"
          >
            <i className="fas fa-rotate-left"></i>
            <span className="text-sm">Reset</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-800 flex items-center justify-center hover:opacity-80 transition"
            title="Toggle theme"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
