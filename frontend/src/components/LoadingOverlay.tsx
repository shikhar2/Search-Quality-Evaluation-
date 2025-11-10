import { useLoading } from '../hooks/useLoading'

const LoadingOverlay = () => {
  const { isLoading, message, subtext } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="glassmorphism rounded-2xl p-8 max-w-md mx-4 card-shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {message}
            </p>
            {subtext && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {subtext}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
