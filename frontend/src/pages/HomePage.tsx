import React, { useState } from "react";
import {
  ArrowRight,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
  Briefcase,
  Plane,
  Gamepad2,
  Coffee,
  Eye,
  ShieldCheck,
} from "lucide-react";
import type { UnifiedProduct } from "../types";
import { ProductCard } from "../components/ProductCard";
import type { NavTab } from "../components/Header";

interface HomePageProps {
  onSearch: (query: string) => void;
  onTabChange: (tab: NavTab) => void;
  recommendedProducts: UnifiedProduct[];
  selectedCompareIds: string[];
  onToggleCompare: (product: UnifiedProduct) => void;
  onToggleSave: (product: UnifiedProduct) => void;
  onQuickView: (product: UnifiedProduct) => void;
  loading?: boolean;
}

const POPULAR_CATEGORIES = [
  { id: "earbuds", name: "Earbuds & Audio", query: "wireless earbuds", icon: <Headphones size={20} strokeWidth={2} />, desc: "TWS, ANC & sports audio" },
  { id: "laptops", name: "Laptops & PCs", query: "laptops for coding", icon: <Laptop size={20} strokeWidth={2} />, desc: "Ultrabooks & workstations" },
  { id: "smartphones", name: "Smartphones", query: "budget smartphone 5G", icon: <Smartphone size={20} strokeWidth={2} />, desc: "5G phones & flagships" },
  { id: "smartwatches", name: "Smartwatches", query: "smartwatch with long battery life", icon: <Watch size={20} strokeWidth={2} />, desc: "Fitness & heart tracking" },
];

const SHOP_BY_NEED = [
  {
    title: "Study & Productivity",
    desc: "Long battery life, sharp displays, and quiet keyboards for deep work.",
    query: "lightweight laptop for students with long battery life",
    icon: <Briefcase size={20} color="var(--color-royal-blue)" />,
    tag: "Work & Study",
  },
  {
    title: "Travel & Commute",
    desc: "Active noise cancellation and compact cases designed for transit.",
    query: "wireless noise cancelling headphones for travel",
    icon: <Plane size={20} color="var(--color-purple)" />,
    tag: "On The Go",
  },
  {
    title: "Gaming & Performance",
    desc: "Dedicated RTX graphics, high-refresh panels, and responsive cooling.",
    query: "gaming laptop with 16GB RAM and high refresh display",
    icon: <Gamepad2 size={20} color="var(--color-orange)" />,
    tag: "High Power",
  },
  {
    title: "Everyday Essentials",
    desc: "Balanced specifications, durable build quality, and honest value.",
    query: "budget smartphone with 5G and good camera",
    icon: <Coffee size={20} color="var(--color-green)" />,
    tag: "Best Value",
  },
];

const SUGGESTIONS = [
  "Wireless earbuds under ₹3,000",
  "Lightweight laptop under ₹80,000",
  "Noise cancelling headphones",
  "Gym shoes under ₹2,500",
  "Gaming PC under ₹20,000",
];

export const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  onTabChange,
  recommendedProducts,
  selectedCompareIds,
  onToggleCompare,
  onToggleSave,
  onQuickView,
  loading = false,
}) => {
  const [heroQuery, setHeroQuery] = useState("");

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroQuery.trim() || loading) return;
    onSearch(heroQuery.trim());
    onTabChange("explore");
  };

  const handleChipClick = (query: string) => {
    if (loading) return;
    onSearch(query);
    onTabChange("explore");
  };

  const featured = recommendedProducts.length > 0 ? recommendedProducts[0] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
      {/* 1. Hero Section (Balanced Two-Column Shopping Interface) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "40px",
          alignItems: "center",
          padding: "24px 0 8px 0",
        }}
      >
        {/* Left Column: Headline, Value Prop & Natural Language Search */}
        <div>
          {/* Subtle Context Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--color-royal-blue-light)",
              color: "var(--color-royal-blue)",
              border: "1px solid var(--color-royal-blue-border)",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.78rem",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            <ShieldCheck size={14} />
            <span>Dual-Retailer Discovery · Amazon India & Flipkart</span>
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3rem)",
              fontWeight: "800",
              lineHeight: "1.18",
              color: "var(--color-navy)",
              marginBottom: "16px",
              letterSpacing: "-0.03em",
            }}
          >
            Search in plain words.{" "}
            <span style={{ color: "var(--color-royal-blue)" }}>Compare real products.</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.6",
              marginBottom: "24px",
              maxWidth: "520px",
            }}
          >
            Describe your budget, desired hardware specs, or everyday needs. ShopSmart discovers live listings across Amazon and Flipkart, extracts genuine specifications, and helps you evaluate options side by side.
          </p>

          {/* Natural Language Search Box */}
          <form onSubmit={handleHeroSubmit} style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "var(--color-white)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "6px 8px 6px 14px",
                boxShadow: "var(--shadow-sm)",
                transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                gap: "10px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <Search size={18} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="What are you shopping for? (e.g. gym shoes under 2500)"
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.96rem",
                  fontWeight: "500",
                  color: "var(--color-text-primary)",
                  background: "transparent",
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  flexShrink: 0,
                }}
              >
                <span>Search</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Suggested Queries */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-text-muted)", marginRight: "2px" }}>
              Try:
            </span>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(s)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 9px",
                  fontSize: "0.78rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                  e.currentTarget.style.color = "var(--color-royal-blue)";
                  e.currentTarget.style.backgroundColor = "var(--color-royal-blue-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                  e.currentTarget.style.backgroundColor = "var(--color-white)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Authentic Product Discovery Showcase */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="card-clean"
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Retailer Source Tag & Context */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span
                className={`badge-clean ${
                  featured && featured.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"
                }`}
              >
                {featured ? (featured.source === "amazon.in" ? "Amazon India" : "Flipkart") : "Live Discovery Preview"}
              </span>

              {featured?.score !== undefined && (
                <span className="badge-clean badge-blue">
                  Score {Math.round(featured.score)}/100
                </span>
              )}
            </div>

            {/* Product Image Stage */}
            <div
              style={{
                height: "190px",
                backgroundColor: "#FFFFFF",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-subtle)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              {featured && featured.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                  <Headphones size={42} strokeWidth={1.5} color="var(--color-royal-blue)" style={{ marginBottom: "6px" }} />
                  <div style={{ fontSize: "0.78rem" }}>Real-time Retailer Scrape</div>
                </div>
              )}
            </div>

            {/* Brand & Title */}
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: "700",
                color: "var(--color-royal-blue)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {featured?.brand || "VERIFIED HARDWARE"}
            </span>

            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "var(--color-navy)",
                marginBottom: "8px",
                lineHeight: "1.4",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                height: "2.8em",
              }}
              title={featured?.title || "Explore genuine product listings across retailers"}
            >
              {featured?.title || "Active noise cancelling wireless earbuds with fast charging"}
            </h3>

            {/* Spec evidence */}
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
                marginBottom: "16px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                height: "2.6em",
              }}
            >
              {featured?.bullet_points && featured.bullet_points.length > 0
                ? featured.bullet_points[0]
                : "Real verified specifications extracted directly from retailer product pages"}
            </p>

            {/* Price & Action */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "12px",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block" }}>
                  Retail Price
                </span>
                <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)" }}>
                  {featured && featured.price !== null
                    ? `₹${featured.price.toLocaleString("en-IN")}`
                    : "Live Pricing"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (featured) {
                    onQuickView(featured);
                  } else {
                    onSearch("wireless earbuds");
                    onTabChange("explore");
                  }
                }}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              >
                <Eye size={14} />
                <span>Quick View</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "2px" }}>
              Popular Categories
            </h2>
            <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)" }}>
              Browse frequently searched consumer hardware discovered directly across retailers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            style={{
              fontSize: "0.84rem",
              fontWeight: "600",
              color: "var(--color-royal-blue)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          {POPULAR_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleChipClick(cat.query)}
              className="card-clean"
              style={{
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor = "var(--color-white)";
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-royal-blue-light)",
                  color: "var(--color-royal-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {cat.icon}
              </div>

              <div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "2px" }}>
                  {cat.name}
                </h4>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                  {cat.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Recommended Products Grid (Real Discovered Items) */}
      {recommendedProducts.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "2px" }}>
                Recently Discovered Products
              </h2>
              <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)" }}>
                Live items retrieved directly from retailer search results with normalized specifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("explore")}
              style={{
                fontSize: "0.84rem",
                fontWeight: "600",
                color: "var(--color-royal-blue)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Explore all</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {recommendedProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelectedForCompare={selectedCompareIds.includes(product.id)}
                onToggleCompare={onToggleCompare}
                onToggleSave={onToggleSave}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Shop By Need / Decision Scenarios */}
      <section>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "2px" }}>
            Shop by Requirement
          </h2>
          <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)" }}>
            Curated queries structured around specific lifestyle and technical requirements.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {SHOP_BY_NEED.map((need, i) => (
            <div
              key={i}
              onClick={() => handleChipClick(need.query)}
              className="card-clean"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--color-bg-subtle)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {need.icon}
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-xs)",
                    backgroundColor: "var(--color-bg-subtle)",
                    color: "var(--color-navy)",
                  }}
                >
                  {need.tag}
                </span>
              </div>

              <h4 style={{ fontSize: "0.98rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px" }}>
                {need.title}
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "14px", flex: 1 }}>
                {need.desc}
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "var(--color-royal-blue)",
                }}
              >
                <span>Search scenario</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Why ShopSmart — Grounded Engineering Principles */}
      <section
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 30px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ maxWidth: "560px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "6px" }}>
            Engineered for Informed Buying Decisions
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
            ShopSmart replaces endless browser tabs with verified specifications, objective score breakdowns, and transparent retailer pricing.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {/* 1. Natural Language Intent Parsing */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-royal-blue-light)",
                color: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={18} />
            </div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-navy)" }}>
              Natural Language Parsing
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              Describe technical constraints and budget limits in everyday words. ShopSmart extracts structured criteria automatically.
            </p>
          </div>

          {/* 2. Specification-Grounded Scoring */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-green-light)",
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={18} />
            </div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-navy)" }}>
              Objective Match Scoring
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              Scores are calculated deterministically from verified specs, price position, and Bayesian rating confidence.
            </p>
          </div>

          {/* 3. Multi-Product Side-by-Side Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-purple-light)",
                color: "var(--color-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders size={18} />
            </div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-navy)" }}>
              Side-by-Side Comparison
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              Queue candidate products into a unified specification matrix to evaluate price differences and trade-offs.
            </p>
          </div>

          {/* 4. Strict Budget Filtering */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-orange-light)",
                color: "var(--color-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={18} />
            </div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-navy)" }}>
              Strict Budget Enforcement
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              Hard price limits automatically filter out listings outside your target threshold, ensuring realistic options.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
