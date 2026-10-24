import type {
  AppCompareResponse,
  AppSearchResponse,
  ChatResponse,
  ChatTurn,
  HistoryItem,
  SavedProduct,
  SourceName,
  SortPreference,
  SystemStatus,
  UnifiedProduct,
} from "../types";

const getBaseUrl = (): string => {
  const custom = localStorage.getItem("shopsmart_backend_url");
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, "") + "/api";
  }
  return (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "") + "/api";
};

let currentSearchController: AbortController | null = null;

export const apiClient = {
  async search(params: {
    query: string;
    sources?: SourceName[];
    maxResults?: number;
    budgetMax?: number | null;
    sortBy?: SortPreference | null;
    signal?: AbortSignal;
  }): Promise<AppSearchResponse> {
    // Abort previous in-flight search request to prevent stale results from overwriting newer ones
    if (currentSearchController) {
      currentSearchController.abort();
    }
    currentSearchController = new AbortController();
    const effectiveSignal = params.signal || currentSearchController.signal;

    try {
      const res = await fetch(`${getBaseUrl()}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: effectiveSignal,
        body: JSON.stringify({
          query: params.query,
          sources: params.sources || ["amazon.in", "flipkart.com"],
          max_results_per_source: params.maxResults || 10,
          budget_max: params.budgetMax || null,
          sort_by: params.sortBy || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Search failed with status ${res.status}`);
      }
      return res.json();
    } finally {
      if (currentSearchController?.signal === effectiveSignal) {
        currentSearchController = null;
      }
    }
  },

  async compare(productIds: string[], criteria?: string[]): Promise<AppCompareResponse> {
    const res = await fetch(`${getBaseUrl()}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: productIds,
        criteria: criteria || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Comparison failed with status ${res.status}`);
    }
    return res.json();
  },

  async chat(params: {
    message: string;
    history: ChatTurn[];
    productIds?: string[];
  }): Promise<ChatResponse> {
    const res = await fetch(`${getBaseUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
        history: params.history,
        product_ids: params.productIds || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Chat request failed with status ${res.status}`);
    }
    return res.json();
  },

  async getStatus(): Promise<SystemStatus> {
    const res = await fetch(`${getBaseUrl()}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch status (${res.status})`);
    }
    return res.json();
  },

  async updateAIConfig(baseUrl?: string, apiKey?: string, model?: string): Promise<any> {
    const res = await fetch(`${getBaseUrl()}/config/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_url: baseUrl,
        api_key: apiKey,
        model: model,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update AI configuration.");
    }
    return res.json();
  },

  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch(`${getBaseUrl()}/history`);
    if (!res.ok) return [];
    return res.json();
  },

  async clearHistory(): Promise<boolean> {
    const res = await fetch(`${getBaseUrl()}/history`, { method: "DELETE" });
    return res.ok;
  },

  async getSaved(): Promise<SavedProduct[]> {
    const res = await fetch(`${getBaseUrl()}/saved`);
    if (!res.ok) return [];
    return res.json();
  },

  async saveProduct(product: UnifiedProduct): Promise<boolean> {
    const res = await fetch(`${getBaseUrl()}/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    return res.ok;
  },

  async removeSaved(productId: string): Promise<boolean> {
    const res = await fetch(`${getBaseUrl()}/saved/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    return res.ok;
  },
};
