import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => 
    localStorage.getItem('darkMode') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode))
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleTheme = () => setIsDarkMode(prev => !prev)

  return { isDarkMode, toggleTheme }
}
