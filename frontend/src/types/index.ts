export interface EvaluationRequest {
  query: string
  item_title: string
  item_description: string
  item_category: string
  item_attributes: Record<string, string>
}

export interface EvaluationResult {
  relevance_score: number
  confidence: number
  reason_code: string
  ai_reasoning: string
}

export interface BatchEvaluationResult extends EvaluationResult {
  query: string
  item_title: string
  item_description: string
  item_category: string
  item_attributes: Record<string, string>
}

export interface HistoryItem {
  id: number
  timestamp: string
  query: string
  itemTitle: string
  score: number
  confidence: number
  reasonCode: string
  aiReasoning: string
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

// Add these to your existing types/index.ts

export interface SearchItem {
  id?: number
  query: string
  item_title: string
  item_description: string
  item_category: string
  item_attributes: Record<string, any>
  claimed?: boolean
  claimed_at?: string
}

export interface LandingPageState {
  items: SearchItem[]
  selectedItem: SearchItem | null
  claimedItems: SearchItem[]
  isLoading: boolean
}

// Enhanced SearchItem type
export interface SearchItem {
  id?: number | string
  query: string
  item_title: string
  item_description: string
  item_category: string
  item_attributes: Record<string, any>
  claimed?: boolean
  claimed_at?: string
  source?: 'local' | 'claimed' | 'manual'
}

// Add to HistoryItem for source tracking
export interface HistoryItem {
  id: number
  timestamp: string
  query: string
  itemTitle: string
  itemDescription: string
  itemCategory: string
  itemAttributes: Record<string, any>
  score: number
  confidence: number
  reasonCode: string
  aiReasoning: string
  source?: 'claimed_item' | 'manual_entry' | 'batch'
  itemId?: number | string
}

// Navigation state type
export interface NavigationPrefillState {
  item?: SearchItem
  fromLanding?: boolean
  timestamp?: number
}


