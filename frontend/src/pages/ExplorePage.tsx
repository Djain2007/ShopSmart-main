import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Sparkles,
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

const CATEGORY_PILLS = [
  { id: "all", label: "All Items" },
  { id: "footwear", label: "Shoes & Footwear" },
  { id: "earbuds", label: "Earbuds" },
  { id: "laptops", label: "Laptops" },
  { id: "smartphones", label: "Smartphones" },
  { id: "headphones", label: "Headphones" },
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
        marginTop: "20px",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "#F8FAFC",
        padding: "10px 14px",
        fontSize: "0.8rem",
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
          <span style={{ fontWeight: "700" }}>Search Pipeline Diagnostics</span>
          {diagnostics?.search_id && (
            <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
              [{diagnostics.search_id}]
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {timings?.total_duration_ms ? `${timings.total_duration_ms}ms total` : ""}
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.78rem" }}>
            <div><strong>Raw Listings:</strong> {diagnostics?.raw_extracted_count ?? "N/A"}</div>
            <div><strong>Normalized:</strong> {diagnostics?.normalized_count ?? "N/A"}</div>
            <div><strong>Deduplicated:</strong> {diagnostics?.deduplicated_count ?? "N/A"}</div>
            <div><strong>Valid (Passed Filters):</strong> {diagnostics?.valid_filtered_count ?? "N/A"}</div>
            <div><strong>Ranked:</strong> {diagnostics?.ranked_count ?? "N/A"}</div>
            <div><strong>Returned by Backend:</strong> {diagnostics?.returned_count ?? "N/A"}</div>
            <div><strong>Visible in UI:</strong> {visibleCount}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.78rem" }}>
            <div><strong>Retailer Status:</strong> {JSON.stringify(retailerStatus)}</div>
            <div><strong>Retailer Search Time:</strong> {timings?.retailer_search_ms ?? "N/A"}ms</div>
            <div><strong>Normalization & Dedup:</strong> {timings?.normalization_and_dedup_ms ?? "N/A"}ms</div>
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

  // Synchronize query input and reset category to "all" when search response updates
  useEffect(() => {
    if (searchResponse?.query) {
      setQueryInput(searchResponse.query);
    }
    // Always reset local category to "all" when fresh search response arrives
    setSelectedCategory("all");
  }, [searchResponse]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || loading) return;
    setSelectedCategory("all");
    onSearch(queryInput.trim(), sources);
  };

  const handleCategoryClick = (catId: string, label: string) => {
    setSelectedCategory(catId);
    if (catId !== "all") {
      setQueryInput(label);
      onSearch(label, sources);
    }
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
        // Category pill filter
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
        // Relevance / AI match score
        return (b.score ?? 0) - (a.score ?? 0);
      });
  }, [allProducts, sources, minPrice, maxPrice, minRating, selectedCategory, sortBy]);

  // Console developer diagnostics in DEV mode
  useEffect(() => {
    if (searchResponse && import.meta.env.DEV) {
      console.debug("[ShopSmart Diagnostics]", {
        query: searchResponse.query,
        searchId: searchResponse.timings?.search_id,
        totalDurationMs: searchResponse.timings?.total_duration_ms,
        retailerStatus: searchResponse.retailer_status,
        counts: searchResponse.counts,
        visibleInUi: filteredProducts.length,
        aiStatus: searchResponse.ai_status,
        diagnostics: searchResponse.timings?.diagnostics,
      });
    }
  }, [searchResponse, filteredProducts.length]);

  const plan = searchResponse?.search_plan;
  const budget = plan?.constraints?.budget;
  const hasBudget = budget && (budget.min !== null || budget.max !== null);
  const features = plan?.constraints?.required_features || [];
  const brands = plan?.constraints?.preferred_brands || [];

  const retailerStatuses = searchResponse?.retailer_status || {};
  const statusValues = Object.values(retailerStatuses);

  const renderEmptyOrOutcomeState = () => {
    // 1. Initial State (No search performed yet)
    if (!searchResponse) {
      return (
        <div
          className="card-clean"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--color-royal-blue-light)",
              color: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={28} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Start searching or pick a category
          </h3>

          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", maxWidth: "460px" }}>
            Type what you need in plain words above (e.g. 'gym shoes under 2500' or 'wireless earbuds under 3000') to crawl live listings on Amazon and Flipkart.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => onSearch("Gym Shoes under 2500")}
              className="btn-secondary"
            >
              Gym Shoes under 2.5k
            </button>
            <button
              type="button"
              onClick={() => onSearch("laptops for coding under 80000")}
              className="btn-secondary"
            >
              Coding Laptops under 80k
            </button>
            <button
              type="button"
              onClick={() => onSearch("wireless noise cancelling earbuds under 3000")}
              className="btn-secondary"
            >
              ANC Earbuds under 3k
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
            padding: "50px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--color-rose-light)",
              color: "var(--color-rose)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Retailer Verification Challenge Active
          </h3>

          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", maxWidth: "480px" }}>
            Both Amazon India and Flipkart required interactive browser verification (CAPTCHA) to protect against automated queries at this moment. Live products could not be retrieved.
          </p>

          <button
            type="button"
            onClick={() => onSearch(queryInput || searchResponse.query, sources)}
            className="btn-primary"
            style={{ marginTop: "8px" }}
          >
            <RefreshCw size={15} />
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
            padding: "50px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#FEF3C7",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WifiOff size={28} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Retailers Currently Unreachable
          </h3>

          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", maxWidth: "480px" }}>
            Connections to Amazon India and Flipkart search endpoints timed out or failed. Please check your network or try again in a few moments.
          </p>

          <button
            type="button"
            onClick={() => onSearch(queryInput || searchResponse.query, sources)}
            className="btn-primary"
            style={{ marginTop: "8px" }}
          >
            <RefreshCw size={15} />
            <span>Retry Connection</span>
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
            padding: "50px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#F1F5F9",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SearchX size={28} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
            No products found for "{searchResponse.query}"
          </h3>

          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", maxWidth: "480px" }}>
            Live retailers responded but returned no products matching your query or budget constraints. Try simplifying keywords or broadening the budget.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => onSearch("gym shoes")}
              className="btn-secondary"
            >
              Search "gym shoes" (Any Budget)
            </button>
            <button
              type="button"
              onClick={() => onSearch("running shoes under 3000")}
              className="btn-secondary"
            >
              Search "running shoes under 3000"
            </button>
          </div>
        </div>
      );
    }

    // 5. Products retrieved from backend, but filtered out by local frontend filters
    return (
      <div
        className="card-clean"
        style={{
          padding: "50px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--color-royal-blue-light)",
            color: "var(--color-royal-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Filter size={28} />
        </div>

        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
          No products match the selected filters
        </h3>

        <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", maxWidth: "480px" }}>
          We retrieved {allProducts.length} live products for "{searchResponse.query}", but your active filters excluded all of them.
        </p>

        <button
          type="button"
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
            setMinRating(0);
            setSelectedCategory("all");
            setSources(["amazon.in", "flipkart.com"]);
          }}
          className="btn-primary"
          style={{ marginTop: "8px" }}
        >
          <RefreshCw size={15} />
          <span>Reset All Filters ({allProducts.length} Products Available)</span>
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Search & Interpretation Banner */}
      <section
        className="card-clean"
        style={{
          padding: "24px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "4px" }}>
            Explore & Search Products
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
            Search across live Amazon India and Flipkart catalogs with natural language specification extraction.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#F8FAFC",
              border: "2px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "6px 8px 6px 16px",
              boxShadow: "var(--shadow-sm)",
              transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
              gap: "10px",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.12)";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
          >
            <Search size={20} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search products in plain words (e.g. gym shoes under 2500, laptop for coding under 80000)..."
              disabled={loading}
              style={{
                border: "none",
                background: "none",
                outline: "none",
                width: "100%",
                fontSize: "1rem",
                color: "var(--color-text-primary)",
                fontWeight: "500",
              }}
            />

            {queryInput && !loading && (
              <button
                type="button"
                onClick={() => setQueryInput("")}
                style={{
                  color: "var(--color-text-muted)",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="btn-primary"
              style={{
                padding: "10px 22px",
                borderRadius: "var(--radius-md)",
                flexShrink: 0,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Find</span>
              )}
            </button>
          </div>
        </form>

        {/* Retailer Source Toggles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-text-secondary)" }}>
              Retailers:
            </span>
            <button
              type="button"
              onClick={() => toggleSource("amazon.in")}
              className={`badge-clean ${sources.includes("amazon.in") ? "badge-amazon" : ""}`}
              style={{
                cursor: "pointer",
                border: sources.includes("amazon.in") ? "1px solid var(--color-amazon-border)" : "1px solid var(--color-border)",
                backgroundColor: sources.includes("amazon.in") ? "var(--color-amazon-bg)" : "#FFFFFF",
                opacity: sources.includes("amazon.in") ? 1 : 0.5,
              }}
            >
              Amazon India
            </button>
            <button
              type="button"
              onClick={() => toggleSource("flipkart.com")}
              className={`badge-clean ${sources.includes("flipkart.com") ? "badge-flipkart" : ""}`}
              style={{
                cursor: "pointer",
                border: sources.includes("flipkart.com") ? "1px solid var(--color-flipkart-border)" : "1px solid var(--color-border)",
                backgroundColor: sources.includes("flipkart.com") ? "var(--color-flipkart-bg)" : "#FFFFFF",
                opacity: sources.includes("flipkart.com") ? 1 : 0.5,
              }}
            >
              Flipkart
            </button>
          </div>

          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            Live dual-retailer scraping with verified specs
          </span>
        </div>

        {/* Interpreted Search Intent Chips (if present) */}
        {plan && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px dashed var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                marginRight: "4px",
              }}
            >
              <Sparkles size={14} color="var(--color-royal-blue)" />
              Extracted Intent:
            </span>

            {plan.category && (
              <span className="badge-clean badge-blue">
                <Tag size={12} />
                Category: {plan.category}
              </span>
            )}

            {hasBudget && budget && (
              <span className="badge-clean badge-green">
                <DollarSign size={12} />
                Budget: {budget.min ? `₹${budget.min.toLocaleString("en-IN")} - ` : "Up to "}
                {budget.max ? `₹${budget.max.toLocaleString("en-IN")}` : "Any"}
              </span>
            )}

            {brands.length > 0 && (
              <span className="badge-clean badge-purple">
                Brands: {brands.join(", ")}
              </span>
            )}

            {features.length > 0 && (
              <span className="badge-clean badge-orange">
                <Cpu size={12} />
                Target Specs: {features.join(", ")}
              </span>
            )}

            {plan.intended_use && (
              <span className="badge-clean" style={{ backgroundColor: "#F1F5F9", color: "var(--color-navy)" }}>
                Use: {plan.intended_use}
              </span>
            )}
          </div>
        )}
      </section>

      {/* 2. Partial Results Notice & Warnings */}
      {searchResponse && searchResponse.warnings && searchResponse.warnings.length > 0 && (
        <div
          style={{
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "0.86rem",
            color: "#92400E",
          }}
        >
          {searchResponse.warnings.map((warn, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={16} color="#D97706" style={{ flexShrink: 0 }} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Search Error message if any */}
      {searchError && (
        <div
          style={{
            backgroundColor: "var(--color-rose-light)",
            border: "1px solid #FECDD3",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--color-rose)",
            fontSize: "0.9rem",
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{searchError}</span>
        </div>
      )}

      {/* 4. Category Filter Pills */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {CATEGORY_PILLS.map((pill) => {
          const isSelected = selectedCategory === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleCategoryClick(pill.id, pill.label)}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: isSelected ? "700" : "500",
                backgroundColor: isSelected ? "var(--color-royal-blue)" : "var(--color-white)",
                color: isSelected ? "#FFFFFF" : "var(--color-navy)",
                border: isSelected ? "1px solid var(--color-royal-blue)" : "1px solid var(--color-border)",
                boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "var(--shadow-xs)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)",
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </section>

      {/* 5. Filter & Sort Toolbar */}
      <section
        className="card-clean"
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {/* Left: Result Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </span>
          {allProducts.length > 0 && filteredProducts.length !== allProducts.length && (
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              (filtered from {allProducts.length} retrieved)
            </span>
          )}
        </div>

        {/* Right: Price Filters & Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          {/* Price Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>Price:</span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                width: "75px",
                padding: "6px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.82rem",
                color: "var(--color-navy)",
                outline: "none",
              }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                width: "80px",
                padding: "6px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.82rem",
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
              padding: "6px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "#FFFFFF",
              color: "var(--color-navy)",
              fontSize: "0.82rem",
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

          {/* Sorting Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowUpDown size={15} color="var(--color-text-secondary)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortPreference)}
              style={{
                padding: "6px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "#FFFFFF",
                color: "var(--color-navy)",
                fontSize: "0.84rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="relevance">ShopSmart Match — Highest</option>
              <option value="price_asc">Price — Low to High</option>
              <option value="price_desc">Price — High to Low</option>
              <option value="rating_desc">Customer Rating</option>
              <option value="review_count_desc">Most Reviewed</option>
            </select>
          </div>
        </div>
      </section>

      {/* 6. Products Grid or Loading / Honest Outcome State */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card-clean"
              style={{
                height: "440px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  height: "200px",
                  backgroundColor: "#F1F5F9",
                  borderRadius: "var(--radius-md)",
                  animation: "pulse 1.5s infinite ease-in-out",
                }}
              />
              <div style={{ height: "18px", width: "40%", backgroundColor: "#F1F5F9", borderRadius: "4px" }} />
              <div style={{ height: "24px", width: "90%", backgroundColor: "#F1F5F9", borderRadius: "4px" }} />
              <div style={{ height: "22px", width: "50%", backgroundColor: "#F1F5F9", borderRadius: "4px" }} />
              <div style={{ height: "36px", marginTop: "auto", backgroundColor: "#F1F5F9", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
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
