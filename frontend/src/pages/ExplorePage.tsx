import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Tag,
  DollarSign,
  Cpu,
  AlertTriangle,
  ArrowUpDown,
  ShoppingCart,
  Loader2,
  RefreshCw,
  Info,
  ShieldAlert,
  WifiOff,
  SearchX,
  Filter,
  Terminal,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import type {
  AppSearchResponse,
  SourceName,
  SortPreference,
  UnifiedProduct,
} from "../types";
import { ProductCard } from "../components/ProductCard";
import { QuickViewModal } from "../components/QuickViewModal";

interface ExplorePageProps {
  searchResponse: AppSearchResponse | null;
  loading: boolean;
  searchError: string | null;
  onSearch: (query: string, sources?: SourceName[]) => void;
  selectedCompareIds: string[];
  onToggleCompare: (product: UnifiedProduct) => void;
  onToggleSave: (product: UnifiedProduct) => void;
}

const CATEGORY_OPTIONS = [
  { id: "all", label: "All Categories" },
  { id: "footwear", label: "Footwear & Shoes" },
  { id: "earbuds", label: "Earbuds & Audio" },
  { id: "laptops", label: "Laptops & PCs" },
  { id: "smartphones", label: "Smartphones" },
  { id: "headphones", label: "Over-Ear Headphones" },
  { id: "smartwatches", label: "Smartwatches" },
  { id: "fashion", label: "Apparel & Fashion" },
];

const DevDiagnosticsBar: React.FC<{
  diagnostics?: any;
  timings?: any;
  retailerStatus: Record<string, string>;
  visibleCount: number;
}> = ({ diagnostics, timings, retailerStatus, visibleCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!diagnostics && !timings) return null;

  return (
    <div
      style={{
        marginTop: "24px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-white)",
        padding: "10px 14px",
        fontSize: "0.78rem",
        color: "var(--color-navy)",
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Terminal size={14} color="var(--color-royal-blue)" />
          <span style={{ fontWeight: "600" }}>Pipeline Diagnostics</span>
          {diagnostics?.search_id && (
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              [{diagnostics.search_id}]
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            {timings?.total_duration_ms ? `${timings.total_duration_ms}ms total` : ""}
          </span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.76rem" }}>
            <div><strong>Raw Scraped:</strong> {diagnostics?.raw_extracted_count ?? "N/A"}</div>
            <div><strong>Normalized:</strong> {diagnostics?.normalized_count ?? "N/A"}</div>
            <div><strong>Deduplicated:</strong> {diagnostics?.deduplicated_count ?? "N/A"}</div>
            <div><strong>Valid:</strong> {diagnostics?.valid_filtered_count ?? "N/A"}</div>
            <div><strong>Submitted to AI:</strong> {diagnostics?.submitted_for_ranking_count ?? "N/A"}</div>
            <div><strong>Ranked:</strong> {diagnostics?.ranked_count ?? "N/A"}</div>
            <div><strong>Returned:</strong> {diagnostics?.returned_count ?? "N/A"}</div>
            <div><strong>Rendered:</strong> {visibleCount}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
            <div><strong>Retailers:</strong> {JSON.stringify(retailerStatus)}</div>
            <div><strong>Scrape Latency:</strong> {timings?.retailer_search_ms ?? "N/A"}ms</div>
            <div><strong>AI Ranking:</strong> {timings?.ai_ranking_ms ?? "N/A"}ms ({timings?.ai_ranking_status ?? "N/A"})</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExplorePage: React.FC<ExplorePageProps> = ({
  searchResponse,
  loading,
  searchError,
  onSearch,
  selectedCompareIds,
  onToggleCompare,
  onToggleSave,
}) => {
  const [queryInput, setQueryInput] = useState(searchResponse?.query || "");
  const [sources, setSources] = useState<SourceName[]>(["amazon.in", "flipkart.com"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortPreference>("relevance");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [quickViewProduct, setQuickViewProduct] = useState<UnifiedProduct | null>(null);

  // Synchronize query input and reset filters when fresh search response arrives
  useEffect(() => {
    if (searchResponse?.query) {
      setQueryInput(searchResponse.query);
    }
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
  }, [searchResponse?.query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || loading) return;
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    onSearch(queryInput.trim(), sources);
  };

  const toggleSource = (source: SourceName) => {
    if (sources.includes(source)) {
      if (sources.length > 1) {
        setSources(sources.filter((s) => s !== source));
      }
    } else {
      setSources([...sources, source]);
    }
  };

  const allProducts = useMemo(() => searchResponse?.products || [], [searchResponse]);

  // Local filtering & safe sorting
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        // Source filter
        if (!sources.includes(p.source)) return false;
        // Price filter
        if (minPrice && p.price !== null && p.price < parseFloat(minPrice)) return false;
        if (maxPrice && p.price !== null && p.price > parseFloat(maxPrice)) return false;
        // Rating filter: unknown ratings (null) do NOT fail rating filters
        if (minRating > 0 && p.rating !== null && p.rating < minRating) return false;
        // Category filter
        if (selectedCategory !== "all") {
          const t = p.title.toLowerCase();
          if (selectedCategory === "footwear" && !t.includes("shoe") && !t.includes("sneaker") && !t.includes("running") && !t.includes("boot") && !t.includes("casual")) return false;
          if (selectedCategory === "fashion" && !t.includes("shirt") && !t.includes("jean") && !t.includes("pant") && !t.includes("wear") && !t.includes("dress") && !t.includes("jacket")) return false;
          if (selectedCategory === "earbuds" && !t.includes("earbud") && !t.includes("tws") && !t.includes("airpod") && !t.includes("buds")) return false;
          if (selectedCategory === "laptops" && !t.includes("laptop") && !t.includes("notebook") && !t.includes("macbook") && !t.includes("ideapad")) return false;
          if (selectedCategory === "smartphones" && !t.includes("phone") && !t.includes("smartphone") && !t.includes("5g") && !t.includes("galaxy")) return false;
          if (selectedCategory === "headphones" && !t.includes("headphone") && !t.includes("headset")) return false;
          if (selectedCategory === "smartwatches" && !t.includes("watch") && !t.includes("smartwatch")) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return a.price - b.price;
        }
        if (sortBy === "price_desc") {
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return b.price - a.price;
        }
        if (sortBy === "rating_desc") {
          if (a.rating === null && b.rating === null) return 0;
          if (a.rating === null) return 1;
          if (b.rating === null) return -1;
          return b.rating - a.rating;
        }
        if (sortBy === "review_count_desc") {
          if (a.review_count === null && b.review_count === null) return 0;
          if (a.review_count === null) return 1;
          if (b.review_count === null) return -1;
          return b.review_count - a.review_count;
        }
        return (b.score ?? 0) - (a.score ?? 0);
      });
  }, [allProducts, sources, minPrice, maxPrice, minRating, selectedCategory, sortBy]);

  const plan = searchResponse?.search_plan;
  const budget = plan?.constraints?.budget;
  const hasBudget = budget && (budget.min !== null || budget.max !== null);
  const features = plan?.constraints?.required_features || [];
  const brands = plan?.constraints?.preferred_brands || [];

  const retailerStatuses = searchResponse?.retailer_status || {};
  const statusValues = Object.values(retailerStatuses);

  const isFilterActive = minPrice !== "" || maxPrice !== "" || minRating > 0 || selectedCategory !== "all" || sources.length < 2;

  const resetAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setSelectedCategory("all");
    setSources(["amazon.in", "flipkart.com"]);
  };

  const renderEmptyOrOutcomeState = () => {
    // 1. Initial State (No search performed yet)
    if (!searchResponse) {
      return (
        <div
          className="card-clean"
          style={{
            padding: "54px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-royal-blue-light)",
              color: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={24} />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Search products in natural language
          </h3>

          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "440px", lineHeight: "1.5" }}>
            Enter your desired specifications, price limits, or lifestyle needs to crawl live catalog listings across Amazon India and Flipkart.
          </p>

          <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => onSearch("Gym Shoes under 2500")}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
            >
              Gym Shoes under ₹2,500
            </button>
            <button
              type="button"
              onClick={() => onSearch("laptops for coding under 80000")}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
            >
              Coding Laptops under ₹80k
            </button>
            <button
              type="button"
              onClick={() => onSearch("wireless noise cancelling earbuds under 3000")}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
            >
              ANC Earbuds under ₹3k
            </button>
          </div>
        </div>
      );
    }

    // 2. All Retailers Blocked by Bot Challenge
    const allBlocked = statusValues.length > 0 && statusValues.every((s) => s === "blocked");
    if (allProducts.length === 0 && allBlocked) {
      return (
        <div
          className="card-clean"
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-rose-light)",
              color: "var(--color-rose)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={24} />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Retailer Verification Challenge Active
          </h3>

          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "460px", lineHeight: "1.5" }}>
            Both Amazon India and Flipkart presented interactive human verification challenges. Live listings could not be scraped automatically at this time.
          </p>

          <button
            type="button"
            onClick={() => onSearch(queryInput || searchResponse.query, sources)}
            className="btn-primary"
            style={{ marginTop: "4px" }}
          >
            <RefreshCw size={14} />
            <span>Retry Search</span>
          </button>
        </div>
      );
    }

    // 3. All Retailers Unavailable / Timeout
    const allUnavailable = statusValues.length > 0 && statusValues.every((s) => s === "blocked" || s === "unavailable" || s === "timeout" || s.startsWith("error"));
    if (allProducts.length === 0 && allUnavailable) {
      return (
        <div
          className="card-clean"
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-orange-light)",
              color: "var(--color-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WifiOff size={24} />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Retailer Endpoints Unreachable
          </h3>

          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "460px", lineHeight: "1.5" }}>
            Connection to retailer search endpoints timed out. Please check your network connection or retry in a few moments.
          </p>

          <button
            type="button"
            onClick={() => onSearch(queryInput || searchResponse.query, sources)}
            className="btn-primary"
            style={{ marginTop: "4px" }}
          >
            <RefreshCw size={14} />
            <span>Retry Search</span>
          </button>
        </div>
      );
    }

    // 4. Zero Products returned from retailers matching search terms
    if (allProducts.length === 0) {
      return (
        <div
          className="card-clean"
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg-subtle)",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SearchX size={24} />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
            No products found for "{searchResponse.query}"
          </h3>

          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "460px", lineHeight: "1.5" }}>
            Retailers responded but returned no products matching your specific query terms or budget constraints.
          </p>

          <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => onSearch("gym shoes")}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
            >
              Search "gym shoes" (Any Budget)
            </button>
            <button
              type="button"
              onClick={() => onSearch("wireless earbuds")}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
            >
              Search "wireless earbuds"
            </button>
          </div>
        </div>
      );
    }

    // 5. Products exist in backend response, but filtered out by user filters
    return (
      <div
        className="card-clean"
        style={{
          padding: "48px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-royal-blue-light)",
            color: "var(--color-royal-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Filter size={24} />
        </div>

        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
          No products match the selected filters
        </h3>

        <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "460px", lineHeight: "1.5" }}>
          We retrieved {allProducts.length} verified products for "{searchResponse.query}", but your active filter settings excluded all of them.
        </p>

        <button
          type="button"
          onClick={resetAllFilters}
          className="btn-primary"
          style={{ marginTop: "4px" }}
        >
          <RefreshCw size={14} />
          <span>Reset Filters ({allProducts.length} Available)</span>
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Search Console Section */}
      <section
        className="card-clean"
        style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ marginBottom: "14px" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "3px" }}>
            Explore & Search Products
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)" }}>
            Natural language shopping across Amazon India and Flipkart with grounded specification parsing.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "4px 6px 4px 12px",
              boxShadow: "var(--shadow-xs)",
              transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
              gap: "8px",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "var(--shadow-xs)";
            }}
          >
            <Search size={18} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search in plain words (e.g. gym shoes under 2500, laptop with 16GB RAM for coding)..."
              disabled={loading}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "0.92rem",
                color: "var(--color-text-primary)",
                fontWeight: "500",
              }}
            />

            {queryInput && !loading && (
              <button
                type="button"
                onClick={() => setQueryInput("")}
                aria-label="Clear query input"
                style={{
                  color: "var(--color-text-muted)",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="btn-primary"
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                flexShrink: 0,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Find</span>
              )}
            </button>
          </div>
        </form>

        {/* Source Retailers Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "600", color: "var(--color-text-secondary)" }}>
              Retailer Discovery:
            </span>
            <button
              type="button"
              onClick={() => toggleSource("amazon.in")}
              className={`badge-clean ${sources.includes("amazon.in") ? "badge-amazon" : "badge-neutral"}`}
              style={{
                cursor: "pointer",
                opacity: sources.includes("amazon.in") ? 1 : 0.6,
              }}
            >
              {sources.includes("amazon.in") && <Check size={11} strokeWidth={2.5} />}
              <span>Amazon India</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSource("flipkart.com")}
              className={`badge-clean ${sources.includes("flipkart.com") ? "badge-flipkart" : "badge-neutral"}`}
              style={{
                cursor: "pointer",
                opacity: sources.includes("flipkart.com") ? 1 : 0.6,
              }}
            >
              {sources.includes("flipkart.com") && <Check size={11} strokeWidth={2.5} />}
              <span>Flipkart</span>
            </button>
          </div>

          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            Concurrent live scraping with verified pricing
          </span>
        </div>

        {/* Extracted Intent Tags (if present in plan) */}
        {plan && (
          <div
            style={{
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginRight: "4px" }}>
              Parsed Criteria:
            </span>

            {plan.category && (
              <span className="badge-clean badge-blue">
                <Tag size={11} />
                {plan.category}
              </span>
            )}

            {hasBudget && budget && (
              <span className="badge-clean badge-green">
                <DollarSign size={11} />
                {budget.min ? `₹${budget.min.toLocaleString("en-IN")} - ` : "≤ "}
                {budget.max ? `₹${budget.max.toLocaleString("en-IN")}` : "Any"}
              </span>
            )}

            {brands.length > 0 && (
              <span className="badge-clean badge-purple">
                Brand: {brands.join(", ")}
              </span>
            )}

            {features.length > 0 && (
              <span className="badge-clean badge-orange">
                <Cpu size={11} />
                {features.join(", ")}
              </span>
            )}

            {plan.intended_use && (
              <span className="badge-clean badge-neutral">
                Use: {plan.intended_use}
              </span>
            )}
          </div>
        )}
      </section>

      {/* 2. Retailer Notice & Warnings Banner (Unobtrusive & Clean) */}
      {searchResponse && searchResponse.warnings && searchResponse.warnings.length > 0 && (
        <div
          style={{
            backgroundColor: "#F8FAFC",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "0.8rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={14} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
            <span>
              {searchResponse.warnings.find((w) => w.includes("challenge") || w.includes("unreachable") || w.includes("timed out")) ||
                searchResponse.warnings[0]}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {statusValues.includes("blocked") && (
              <span className="badge-clean badge-orange" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                Partial Results
              </span>
            )}
            {searchResponse.ai_status === "ready" ? (
              <span className="badge-clean badge-green" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                Verified Match
              </span>
            ) : (
              <span className="badge-clean badge-neutral" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                Factual Scoring
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Search Error message if any */}
      {searchError && (
        <div
          style={{
            backgroundColor: "var(--color-rose-light)",
            border: "1px solid var(--color-rose-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-rose)",
            fontSize: "0.86rem",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{searchError}</span>
        </div>
      )}

      {/* 4. Filter & Sort Toolbar */}
      <section
        className="card-clean"
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          borderRadius: "var(--radius-md)",
        }}
      >
        {/* Left: Result Count, Timings & Active Filters Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.86rem", fontWeight: "600", color: "var(--color-navy)" }}>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </span>
          {allProducts.length > 0 && filteredProducts.length !== allProducts.length && (
            <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
              ({allProducts.length} retrieved)
            </span>
          )}

          {searchResponse?.timings?.total_duration_ms && (
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-bg-subtle)",
                padding: "2px 6px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--color-border)",
              }}
            >
              {(searchResponse.timings.total_duration_ms / 1000).toFixed(1)}s
              {searchResponse.timings.cache_hit && " · cached"}
            </span>
          )}

          {isFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                fontSize: "0.76rem",
                fontWeight: "600",
                color: "var(--color-royal-blue)",
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: Category, Price, Rating, Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "5px 10px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-navy)",
              fontSize: "0.8rem",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Price Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>₹</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                width: "65px",
                padding: "4px 6px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                color: "var(--color-navy)",
                outline: "none",
              }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                width: "70px",
                padding: "4px 6px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                color: "var(--color-navy)",
                outline: "none",
              }}
            />
          </div>

          {/* Rating Filter */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            style={{
              padding: "5px 10px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-navy)",
              fontSize: "0.8rem",
              fontWeight: "500",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="0">All Ratings</option>
            <option value="4.0">4.0★ and above</option>
            <option value="4.2">4.2★ and above</option>
            <option value="4.5">4.5★ and above</option>
          </select>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpDown size={13} color="var(--color-text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortPreference)}
              style={{
                padding: "5px 10px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-white)",
                color: "var(--color-navy)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="relevance">Match Score</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="review_count_desc">Most Reviewed</option>
            </select>
          </div>
        </div>
      </section>

      {/* 5. Products Grid / Skeletons / Empty States */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card-clean"
              style={{
                height: "380px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-shimmer" style={{ height: "16px", width: "70px", borderRadius: "var(--radius-xs)" }} />
                <div className="skeleton-shimmer" style={{ height: "16px", width: "40px", borderRadius: "var(--radius-xs)" }} />
              </div>
              <div className="skeleton-shimmer" style={{ height: "170px", borderRadius: "var(--radius-sm)" }} />
              <div className="skeleton-shimmer" style={{ height: "12px", width: "40%", borderRadius: "var(--radius-xs)" }} />
              <div className="skeleton-shimmer" style={{ height: "16px", width: "90%", borderRadius: "var(--radius-xs)" }} />
              <div className="skeleton-shimmer" style={{ height: "14px", width: "60%", borderRadius: "var(--radius-xs)" }} />
              <div className="skeleton-shimmer" style={{ height: "20px", width: "45%", borderRadius: "var(--radius-xs)" }} />
              <div className="skeleton-shimmer" style={{ height: "30px", marginTop: "auto", borderRadius: "var(--radius-sm)" }} />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isSelectedForCompare={selectedCompareIds.includes(p.id)}
              onToggleCompare={onToggleCompare}
              onToggleSave={onToggleSave}
              onQuickView={(prod) => setQuickViewProduct(prod)}
            />
          ))}
        </div>
      ) : (
        renderEmptyOrOutcomeState()
      )}

      {/* Developer Diagnostics (Shown in development mode) */}
      {import.meta.env.DEV && searchResponse?.timings && (
        <DevDiagnosticsBar
          diagnostics={searchResponse.timings.diagnostics}
          timings={searchResponse.timings}
          retailerStatus={searchResponse.retailer_status || {}}
          visibleCount={filteredProducts.length}
        />
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={quickViewProduct !== null}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        isSelectedForCompare={quickViewProduct ? selectedCompareIds.includes(quickViewProduct.id) : false}
        onToggleCompare={onToggleCompare}
        onToggleSave={onToggleSave}
      />
    </div>
  );
};
