// Common interfaces for the application

// Interface for item attributes (flexible key-value pairs)
export interface ItemAttributes {
  [key: string]: string | number | boolean;
}

// Interface for a query item
export interface QueryItem {
  query: string;
  item_title: string;
  item_description: string;
  item_category: string;
  item_attributes: ItemAttributes;
}

// Interface for evaluation result
export interface EvaluationResult {
  relevance_score: number; // 1-8 scale
  confidence: number; // 0-1
  reason_code?: string | null;
  ai_reasoning?: string;
}

// Interface for batch evaluation request
export interface BatchEvaluationRequest {
  evaluations: QueryItem[];
}

// Interface for batch evaluation response
export interface BatchEvaluationResponse {
  results: EvaluationResult[];
}

// Interface for history item
export interface HistoryItem {
  timestamp: number;
  query: QueryItem;
  result: EvaluationResult;
  id: string; // Unique identifier
}

// Interface for statistics
export interface Statistics {
  total: number;
  average: number;
  excellent: number;  // scores 7-8
  good: number;      // scores 5-6
  poor: number;      // scores 1-4
}

// Quality assessment mapping
export type QualityAssessment = 'EXCELLENT' | 'GOOD' | 'OKAY' | 'INFORMATIONAL' | 'BAD' | 'NONSENSICAL' | 'EMBARRASSING' | 'UTD' | 'PDNL';

export const QualityAssessments: Record<number, QualityAssessment> = {
  8: 'EXCELLENT',
  7: 'GOOD',
  6: 'OKAY',
  5: 'INFORMATIONAL',
  4: 'BAD',
  3: 'NONSENSICAL',
  2: 'EMBARRASSING',
  1: 'UTD',
  0: 'PDNL'
} as const;