import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string | { text: string; image?: string }
  timestamp: Date
}

interface ProductSidebarProps {
  query: string
  itemTitle: string
  itemCategory: string
}

const ProductSidebar: React.FC<ProductSidebarProps> = ({
  query,
  itemTitle,
  itemCategory
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initial assistant message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && itemTitle) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I can help you learn more about products. You're currently evaluating "${itemTitle}" in the ${itemCategory} category. Feel free to ask me anything about this product or search for information about other products!`,
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, itemTitle, itemCategory])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/query/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: inputMessage })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      // Format Gemini + Serper response
      const formattedResponse = {
        text: `
**${data.title}**

${data.summary}

${data.key_points && data.key_points.length > 0
  ? 'Key Points:\n- ' + data.key_points.join('\n- ')
  : ''}
        `.trim(),
        image: data.image_url
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was a problem connecting to the backend.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setInputMessage('')
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 z-50"
          title="Open Product Assistant"
        >
          🤖
        </button>
      )}

      {/* Chat Widget */}
      <div
        className={`fixed bottom-6 right-6 w-[400px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 transform ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🤖</span> Product Assistant
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">Ask me anything</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors text-white text-lg font-bold"
            title="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-5xl mb-3">💡</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Start a Conversation
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Ask me about product features, specs, or alternatives!
              </p>
              <div className="space-y-2 w-full">
                <button
                  onClick={() => setInputMessage(`Tell me about ${itemTitle}`)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Tell me about this product
                </button>
                <button
                  onClick={() => setInputMessage(`What are the best features?`)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  What are the best features?
                </button>
                <button
                  onClick={() => setInputMessage(`Show me alternatives`)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Show me alternatives
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {/* Render text + image */}
                    {typeof msg.content === 'string' ? (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content.text}
                        </p>
                        {msg.content.image && (
                        <img
  src={msg.content.image}
  alt="Product related"
  className="w-full rounded-lg border bg-black border-gray-200 dark:border-gray-600 shadow-sm"
/>

                        )}
                      </div>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 rounded-b-2xl">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="w-full mb-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
              🗑️ Clear Chat
            </button>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Ask about products..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>🔍</span>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 text-center">
            Press Enter to send
          </p>
        </div>
      </div>
    </>
  )
}

export default ProductSidebar
