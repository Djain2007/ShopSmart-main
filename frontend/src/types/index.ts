export type SourceName = "amazon.in" | "flipkart.com";

export type SortPreference = "relevance" | "price_asc" | "price_desc" | "rating_desc" | "review_count_desc";

export interface Budget {
  min: number | null;
  max: number | null;
  currency: string;
}

export interface Constraints {
  budget: Budget;
  preferred_brands: string[];
  excluded_brands: string[];
  required_features: string[];
  preferred_features: string[];
  excluded_features: string[];
}

export interface Clarification {
  question: string;
  missing: string[];
  blocking: boolean;
}

export interface SearchPlan {
  schema_version: string;
  original_query: string;
  category: string | null;
  intended_use: string | null;
  constraints: Constraints;
  search_terms: string[];
  search_queries: string[];
  sources: SourceName[];
  max_results_per_source: number;
  comparison_criteria: string[];
  sort_preference: SortPreference | null;
  clarification: Clarification | null;
  warnings: string[];
}

export interface ScoreComponent {
  applicable: boolean;
  score: number | null;
  weight: number;
  contribution: number;
  source: string | null;
  note: string | null;
}

export interface ScoreBreakdown {
  budget: ScoreComponent;
  required_features: ScoreComponent;
  preferred_features: ScoreComponent;
  relevance: ScoreComponent;
  brand: ScoreComponent;
  rating: ScoreComponent;
  value: ScoreComponent;
  data_quality: ScoreComponent;
}

export interface Explanation {
  summary: string;
  pros: string[];
  cons: string[];
  unverified: string[];
  source: "llm" | "deterministic";
}

export interface UnifiedProduct {
  id: string;
  title: string;
  brand: string | null;
  price: number | null;
  list_price: number | null;
  currency: string;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  url: string;
  source: SourceName;
  attributes: Record<string, string | number | boolean | null>;
  bullet_points: string[];
  retrieved_at: string;
  rank?: number;
  score?: number;
  confidence?: "high" | "medium" | "low";
  matched_features: string[];
  unverified_features: string[];
  flags: string[];
  explanation?: Explanation;
  score_breakdown?: ScoreBreakdown;
  is_saved: boolean;
}

export interface ExcludedProduct {
  product_id: string;
  reasons: string[];
  detail: string[];
}

export interface Counts {
  received: number;
  excluded: number;
  ranked: number;
  returned: number;
}

export interface Meta {
  schema_version: string;
  backend: string;
  model: string;
  device_type: string;
  latency_ms: number;
  llm_used: boolean;
  degraded: boolean;
}

export interface AppSearchResponse {
  query: string;
  search_plan: SearchPlan;
  products: UnifiedProduct[];
  excluded: ExcludedProduct[];
  counts: Counts;
  ai_status: "connected" | "ready" | "degraded" | "unavailable";
  ai_meta: Meta | null;
  retailer_status: Record<string, string>;
  overall_summary: string | null;
  warnings: string[];
  timings?: Record<string, any>;
}

export interface ComparisonCell {
  product_id: string;
  value: string | null;
  numeric_value: number | null;
  verified: boolean;
}

export interface ComparisonRow {
  criterion: string;
  kind: "price" | "rating" | "review_count" | "brand" | "attribute";
  cells: ComparisonCell[];
  best_product_id: string | null;
  note: string | null;
}

export interface ProductInsight {
  product_id: string;
  strengths: string[];
  weaknesses: string[];
  best_for: string | null;
  unverified: string[];
  source: "llm" | "deterministic";
}

export interface AppCompareResponse {
  rows: ComparisonRow[];
  product_insights: ProductInsight[];
  verdict: string | null;
  ai_status: "connected" | "ready" | "degraded" | "unavailable";
  meta: Meta | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  referenced_product_ids: string[];
  unverified?: string[];
  suggested_followups: string[];
  answer_source: "llm" | "deterministic";
}

export interface HistoryItem {
  id: number;
  query: string;
  results_count: number;
  plan_summary: string | null;
  created_at: string;
}

export interface SavedProduct {
  id: number;
  product_id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  url: string;
  source: string;
  rating: number | null;
  saved_at: string;
  product_details: Partial<UnifiedProduct>;
}

export interface SystemStatus {
  ai_status: "connected" | "ready" | "degraded" | "unavailable";
  ai_config: {
    ai_configured: boolean;
    ai_base_url: string;
    ai_model: string;
    api_key_set: boolean;
    api_key_masked: string;
  };
  ai_health: any | null;
  ai_ready: any | null;
  retailers: Record<string, { name: string; status: string }>;
}
