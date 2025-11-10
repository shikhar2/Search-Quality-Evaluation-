import { FC } from 'react'
import { HistoryItem as HistoryItemType } from '../types'
import { formatTimestamp, getScoreColor } from '../utils/helpers'

interface Props {
  item: HistoryItemType
}

const HistoryItem: FC<Props> = ({ item }) => {
  const scoreColor = getScoreColor(item.score)

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {formatTimestamp(item.timestamp)}
          </div>
          <div className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {item.query}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {item.itemTitle}
          </div>
        </div>
        <div className={`${scoreColor} font-bold text-lg px-2 py-1 rounded`}>
          {item.score}
        </div>
      </div>
    </div>
  )
}

export default HistoryItem
