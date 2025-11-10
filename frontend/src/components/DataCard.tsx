import { FC } from 'react'
import { SearchItem } from '../types'
import { getCategoryColor } from '../utils/helpers'

interface DataCardProps {
  item: SearchItem
  onClaim: (item: SearchItem) => void
  isClaimed: boolean
}

const DataCard: FC<DataCardProps> = ({ item, onClaim, isClaimed }) => {
  const categoryColor = getCategoryColor(item.item_category)

  return (
    <div className={`glassmorphism rounded-2xl p-6 card-shadow-lg border-l-4 ${categoryColor} hover:scale-[1.02] transition-all duration-300 group`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <h3 className={`text-xl font-bold text-gray-800 dark:text-gray-100 ${isClaimed ? 'opacity-60' : ''}`}>
            {item.item_title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <i className="fas fa-search text-primary text-sm"></i>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              "{item.query}"
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isClaimed 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {isClaimed ? (
              <>
                <i className="fas fa-check mr-1"></i>
                Claimed
              </>
            ) : (
              'Available'
            )}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className={`text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 ${isClaimed ? 'opacity-60' : ''}`}>
          {item.item_description}
        </p>
      </div>

      {/* Category Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${categoryColor.replace('border-l', 'bg')} text-white`}>
          <i className="fas fa-tag"></i>
          {item.item_category}
        </span>
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {Object.entries(item.item_attributes).slice(0, 4).map(([key, value]) => (
          <div key={key} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
            <div className="font-medium text-gray-500 dark:text-gray-400 capitalize text-xs mb-1">{key}</div>
            <div className={`font-semibold ${isClaimed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Claim Button */}
      {!isClaimed && (
        <button
          onClick={() => onClaim(item)}
          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 px-6 rounded-lg font-semibold hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] group-hover:scale-100"
        >
          <i className="fas fa-hand-holding-heart mr-2"></i>
          Claim This Item
        </button>
      )}

      {/* Claimed Info */}
      {isClaimed && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center opacity-80">
          <i className="fas fa-check-circle text-green-500 text-lg mb-2"></i>
          <p className="text-sm text-green-700 dark:text-green-300">
            Claimed at {new Date(item.claimed_at || '').toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default DataCard
