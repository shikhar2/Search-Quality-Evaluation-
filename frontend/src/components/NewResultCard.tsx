import { useState } from 'react'
import { EvaluationResult } from '../types'

interface NewResultCardProps {
  result: EvaluationResult
  query: string
  itemTitle: string
  itemImage?: string
  itemPrice?: string
}

const NewResultCard: React.FC<NewResultCardProps> = ({
  result,
  query,
  itemTitle,
  itemImage = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop',
  itemPrice = '$8.97'
}) => {
  const [selectedRating, setSelectedRating] = useState<string>('')
  const [comments, setComments] = useState('')
  const [imageHover, setImageHover] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ratingOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'okay', label: 'Okay' },
    { value: 'bad', label: 'Bad' },
    { value: 'embarrassing', label: 'Embarrassing' },
    { value: 'informational', label: 'Informational' },
    { value: 'nonsensical', label: 'Nonsensical' },
    { value: 'utd', label: 'UTD (Unable to Determine)' },
    { value: 'pdnl', label: 'PDNL (Page Does Not Load)' }
  ]

  const handleSubmitFeedback = async () => {
    if (!selectedRating) {
      alert('Please select a rating before submitting')
      return
    }

    setIsSubmitting(true)

    // TODO: Replace with your actual API call
    try {
      console.log('Submitting feedback:', {
        rating: selectedRating,
        comments,
        query,
        itemTitle,
        score: result.relevance_score
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('✅ Feedback submitted successfully!')
      
      // Optionally reset the form
      // setSelectedRating('')
      // setComments('')
    } catch (error) {
      alert('❌ Failed to submit feedback')
      console.error('Feedback submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glassmorphism rounded-xl p-8">
      <h3 className="text-xl font-semibold mb-6">Sample QIP evaluation</h3>

      {/* Query Display */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Query: <span className="font-medium text-gray-900 dark:text-white">{query}</span>
        </p>
      </div>

      {/* Main Evaluation Container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-800/50">
        {/* Score and Price Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Score: <span className="font-semibold text-gray-900 dark:text-white">{result.relevance_score.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Price: <span className="font-semibold text-gray-900 dark:text-white">{itemPrice}</span>
          </div>
        </div>

        {/* Product Image with Hover */}
        <div className="flex justify-center mb-6">
          <div 
            className="relative inline-block cursor-pointer"
            onMouseEnter={() => setImageHover(true)}
            onMouseLeave={() => setImageHover(false)}
          >
            <img
              src={itemImage}
              alt={itemTitle}
              className={`w-64 h-64 object-cover rounded-lg shadow-md transition-transform duration-300 ${
                imageHover ? 'scale-110' : 'scale-100'
              }`}
            />
            {imageHover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg pointer-events-none">
                <span className="text-white text-sm font-medium px-3 py-1 bg-gray-900 bg-opacity-75 rounded">
                  Hover to Zoom
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h4 className="text-center text-sm text-gray-800 dark:text-gray-200 font-medium mb-8 px-4">
          {itemTitle}
        </h4>

        {/* Rating Options Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {ratingOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="rating"
                value={option.value}
                checked={selectedRating === option.value}
                onChange={(e) => setSelectedRating(e.target.value)}
                disabled={isSubmitting}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
            Add your comments here ...
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add your comments here ..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !selectedRating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewResultCard