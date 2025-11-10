import { FC, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import { Toast as ToastType } from '../types'

interface ToastProps {
  toast: ToastType
}

const Toast: FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  const config = {
    success: { icon: 'fa-check-circle', color: 'border-green-400 text-green-600' },
    error: { icon: 'fa-exclamation-circle', color: 'border-red-400 text-red-600' },
    warning: { icon: 'fa-exclamation-triangle', color: 'border-yellow-400 text-yellow-600' },
    info: { icon: 'fa-info-circle', color: 'border-blue-400 text-blue-600' }
  }

  const style = config[toast.type]

  return (
    <div className={`glassmorphism rounded-lg p-4 border-l-4 ${style.color} card-shadow-lg animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <i className={`fas ${style.icon} ${style.color} text-lg`}></i>
        <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">
          {toast.message}
        </p>
        <button
          onClick={() => removeToast(toast.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}

export default Toast
