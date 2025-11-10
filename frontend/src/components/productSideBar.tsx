import { useState, useEffect } from 'react'

interface ProductInfo {
  name: string
  description: string
  category: string
  features: string[]
  specifications?: Record<string, string>
}

interface AlternativeProduct {
  name: string
  description: string
  price?: string
  rating?: number
  reason: string
}

interface ProductSidebarProps {
  isOpen: boolean
  onClose: () => void
  query: string
  itemTitle: string
  itemCategory: string
}

const ProductSidebar: React.FC<ProductSidebarProps> = ({
  isOpen,
  onClose,
  query,
  itemTitle,
  itemCategory
}) => {
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([])

  useEffect(() => {
    if (isOpen && query && itemTitle) {
      fetchProductInfo()
    }
  }, [isOpen, query, itemTitle])

  const fetchProductInfo = async () => {
    setLoading(true)
    
    try {
      // TODO: Replace this with actual API call to Claude API or web search
      // Example: Use Anthropic API to search and analyze product
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Search the web and provide information about "${itemTitle}" in the category "${itemCategory}". 
              
              Also suggest 3 alternative products that match the query "${query}".
              
              Return ONLY a JSON object with this structure:
              {
                "productInfo": {
                  "name": "product name",
                  "description": "detailed description",
                  "category": "category",
                  "features": ["feature1", "feature2", "feature3"],
                  "specifications": {"key": "value"}
                },
                "alternatives": [
                  {
                    "name": "alternative product name",
                    "description": "short description",
                    "price": "$XX.XX",
                    "rating": 4.5,
                    "reason": "why this is a good alternative"
                  }
                ]
              }`
            }
          ],
          tools: [
            {
              type: 'web_search_20250305',
              name: 'web_search'
            }
          ]
        })
      })

      const data = await response.json()
      
      // Extract text from response
      const textContent = data.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n')
      
      // Parse JSON from response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setProductInfo(parsed.productInfo)
        setAlternatives(parsed.alternatives || [])
      } else {
        // Fallback to mock data if parsing fails
        setMockData()
      }
    } catch (error) {
      console.error('Error fetching product info:', error)
      // Use mock data as fallback
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  const setMockData = () => {
    // Mock data based on the query/title
    setProductInfo({
      name: itemTitle,
      description: `${itemTitle} is a high-quality product in the ${itemCategory} category. It features advanced technology and excellent build quality, making it a popular choice among consumers.`,
      category: itemCategory,
      features: [
        'Premium build quality',
        'Advanced features',
        'User-friendly design',
        'Excellent value for money',
        'Highly rated by customers'
      ],
      specifications: {
        'Brand': 'Premium Brand',
        'Model': 'Latest Model',
        'Weight': '1.5 lbs',
        'Warranty': '1 Year'
      }
    })

    setAlternatives([
      {
        name: `Alternative ${itemCategory} Option 1`,
        description: 'High-quality alternative with similar features and excellent reviews.',
        price: '$89.99',
        rating: 4.5,
        reason: 'Similar features at a competitive price point'
      },
      {
        name: `Alternative ${itemCategory} Option 2`,
        description: 'Premium alternative with advanced features and superior build quality.',
        price: '$129.99',
        rating: 4.7,
        reason: 'Premium features and exceptional durability'
      },
      {
        name: `Alternative ${itemCategory} Option 3`,
        description: 'Budget-friendly option that still delivers great performance.',
        price: '$59.99',
        rating: 4.3,
        reason: 'Best value for budget-conscious buyers'
      }
    ])
  }

  return (
    <>
      {/* Backdrop - only show when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar - always rendered but slides in/out */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Insights</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered product research</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Researching product information...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : (
            <>
              {/* Search Query Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Searching for:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{query}</p>
              </div>

              {/* Product Information */}
              {productInfo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Details</h3>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{productInfo.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {productInfo.description}
                      </p>
                    </div>

                    {/* Features */}
                    {productInfo.features && productInfo.features.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Key Features:</p>
                        <ul className="space-y-1">
                          {productInfo.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Specifications */}
                    {productInfo.specifications && Object.keys(productInfo.specifications).length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Specifications:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(productInfo.specifications).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-gray-500 dark:text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-900 dark:text-white font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Alternative Products */}
              {alternatives.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alternative Options</h3>
                  </div>

                  <div className="space-y-3">
                    {alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex-1">
                            {alt.name}
                          </h4>
                          {alt.price && (
                            <span className="text-green-600 dark:text-green-400 font-bold ml-2">
                              {alt.price}
                            </span>
                          )}
                        </div>

                        {alt.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {alt.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/5</span>
                          </div>
                        )}

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {alt.description}
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Why consider this:</span> {alt.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Note:</span> Product information is AI-generated and may not be 100% accurate. 
                  Please verify details before making purchase decisions.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ProductSidebar