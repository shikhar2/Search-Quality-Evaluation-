import { FC } from 'react'
import { SearchItem } from '../types'
import { getCategoryColor } from '../utils/helpers'

interface DataTableProps {
  items: SearchItem[]
  onClaim: (item: SearchItem) => void
}

const DataTable: FC<DataTableProps> = ({ items, onClaim }) => {
  const getStatusBadge = (item: SearchItem) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1'
    return item.claimed 
      ? `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`
      : `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`
  }

  return (
    <div className="glassmorphism rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <i className="fas fa-table text-primary"></i>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Available Data Items</h3>
          <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            {items.length} items
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Title</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Query</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Category</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Price</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr 
                key={item.id || index} 
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                    {item.item_title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.item_description.length > 50 
                      ? `${item.item_description.substring(0, 50)}...` 
                      : item.item_description
                    }
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                    "{item.query}"
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.item_category).replace('border-l', 'bg')} text-white`}>
                    {item.item_category}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.item_attributes.price || 'N/A'}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={getStatusBadge(item)}>
                    <i className={item.claimed ? 'fas fa-check' : 'fas fa-clock'}></i>
                    {item.claimed ? ' Claimed' : ' Available'}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  {item.claimed ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      <i className="fas fa-check-circle text-green-500 mr-1"></i>
                      Done
                    </span>
                  ) : (
                    <button
                      onClick={() => onClaim(item)}
                      className="text-primary hover:text-primary-dark font-medium flex items-center gap-1 text-sm transition-colors"
                    >
                      <i className="fas fa-hand-holding-heart"></i>
                      Claim
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No items available</h3>
          <p className="text-gray-500 dark:text-gray-500">All data has been claimed or the database is empty</p>
        </div>
      )}
    </div>
  )
}

export default DataTable
