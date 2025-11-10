import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import EvaluationTabs from './components/EvaluationTabs'
import HistoryPanel from './components/HistoryPanel'
import LoadingOverlay from './components/LoadingOverlay'
import ToastContainer from './components/ToastContainer'
import { useTheme } from './hooks/useTheme'
import { checkHealth } from './utils/api'

type HealthStatus = 'healthy' | 'unhealthy' | 'checking'

function App() {
  const { isDarkMode, toggleTheme } = useTheme()
  const [apiHealth, setApiHealth] = useState<HealthStatus>('checking')

  useEffect(() => {
    checkApiHealth()
    const interval = setInterval(checkApiHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkApiHealth = async () => {
    try {
      const isHealthy = await checkHealth()
      setApiHealth(isHealthy ? 'healthy' : 'unhealthy')
    } catch (error) {
      setApiHealth('unhealthy')
    }
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} apiHealth={apiHealth} />
        <main className="px-4 py-8 md:px-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <Hero />
            <EvaluationTabs />
          </div>
        </main>
        <HistoryPanel />
        <LoadingOverlay />
        <ToastContainer />
      </div>
    </div>
  )
}

export default App
