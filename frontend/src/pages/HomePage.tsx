import React, { useState } from "react";
import {
  Sparkles,
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
  { id: "earbuds", name: "Earbuds", icon: <Headphones size={22} />, count: "Over 80 models" },
  { id: "laptops", name: "Laptops", icon: <Laptop size={22} />, count: "Over 120 models" },
  { id: "smartphones", name: "Smartphones", icon: <Smartphone size={22} />, count: "Over 90 models" },
  { id: "headphones", name: "Headphones", icon: <Headphones size={22} />, count: "Over 60 models" },
  { id: "smartwatches", name: "Smartwatches", icon: <Watch size={22} />, count: "Over 45 models" },
];

const SHOP_BY_NEED = [
  {
    title: "Study & Productivity",
    desc: "Long battery life, sharp displays, and crisp audio for focused work sessions.",
    query: "lightweight laptop for students with long battery life",
    icon: <Briefcase size={22} color="var(--color-royal-blue)" />,
    tag: "Work & Study",
  },
  {
    title: "Travel & Commute",
    desc: "Compact noise-cancelling earbuds and lightweight gear designed for life on the go.",
    query: "wireless noise cancelling headphones for travel",
    icon: <Plane size={22} color="var(--color-purple)" />,
    tag: "On The Go",
  },
  {
    title: "Gaming & Performance",
    desc: "High-refresh displays, dedicated RTX graphics, and fast low-latency audio.",
    query: "gaming laptop with 16GB RAM and high refresh display",
    icon: <Gamepad2 size={22} color="var(--color-orange)" />,
    tag: "High Power",
  },
  {
    title: "Everyday Use",
    desc: "Balanced features, reliable durability, and excellent value for everyday tasks.",
    query: "budget smartphone with 5G and good camera",
    icon: <Coffee size={22} color="var(--color-green)" />,
    tag: "Best Value",
  },
];

const SUGGESTIONS = [
  "Wireless earbuds under ₹3,000",
  "Lightweight laptop under ₹80,000",
  "Headphones for long flights",
  "Smartwatch with long battery life",
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

  // Sample or actual featured product
  const featured = recommendedProducts.length > 0 ? recommendedProducts[0] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
      {/* 1. Hero Section (Two Columns) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "48px",
          alignItems: "center",
          padding: "48px 0 12px 0",
        }}
      >
        {/* Left Column: Headline & Natural Language Search */}
        <div>
          {/* Introductory Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--color-lavender)",
              color: "var(--color-purple)",
              border: "1px solid var(--color-lavender-border)",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.82rem",
              fontWeight: "700",
              marginBottom: "20px",
            }}
          >
            <Sparkles size={14} />
            <span>ShopSmart 2.0 · Natural Language Shopping Assistant</span>
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 4.5vw, 3.4rem)",
              fontWeight: "800",
              lineHeight: "1.15",
              color: "var(--color-navy)",
              marginBottom: "18px",
              letterSpacing: "-0.03em",
            }}
          >
            Shopping made{" "}
            <span style={{ color: "var(--color-royal-blue)" }}>smarter.</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.65",
              marginBottom: "28px",
              maxWidth: "540px",
            }}
          >
            Tell us what you need in plain words. We find the right products, explain why they match, and help you decide with confidence.
          </p>

          {/* Large Natural Language Search Box */}
          <form onSubmit={handleHeroSubmit} style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "var(--color-white)",
                border: "2px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                padding: "8px 10px 8px 18px",
                boxShadow: "var(--shadow-lg)",
                transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                gap: "12px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.16)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              }}
            >
              <Search size={22} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Describe what you're looking for..."
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "1.05rem",
                  fontWeight: "500",
                  color: "var(--color-text-primary)",
                  background: "transparent",
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "12px 24px",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                <span>Find</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </form>

          {/* Suggested Searches Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-text-muted)" }}>
              Suggested:
            </span>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(s)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  boxShadow: "var(--shadow-xs)",
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

        {/* Right Column: Featured Product Presentation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Decorative soft blue-purple circular background */}
          <div
            style={{
              position: "absolute",
              width: "380px",
              height: "380px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(241, 238, 255, 0.8) 100%)",
              zIndex: 0,
              filter: "blur(20px)",
            }}
          />

          {/* Featured Product Card */}
          <div
            className="card-clean"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "380px",
              width: "100%",
              padding: "24px",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {/* Top Match Tag */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="badge-clean badge-blue" style={{ fontWeight: "700" }}>
                <Sparkles size={13} />
                98% Top Match
              </span>
              <span className="badge-clean badge-amazon">Amazon India</span>
            </div>

            {/* Product Image Stage */}
            <div
              style={{
                height: "220px",
                backgroundColor: "#F8FAFC",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              {featured && featured.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                />
              ) : (
                <img
                  src="https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg"
                  alt="Sony WH-1000XM5"
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    // Fallback visual if offline
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            {/* Brand & Title */}
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: "700",
                color: "var(--color-royal-blue)",
                textTransform: "uppercase",
              }}
            >
              {featured?.brand || "SONY"}
            </span>

            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                marginBottom: "8px",
                lineHeight: "1.35",
              }}
            >
              {featured?.title || "Sony WH-1000XM5 Wireless Noise Cancelling Headphones"}
            </h3>

            {/* Key Feature Highlight */}
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--color-text-secondary)",
                marginBottom: "16px",
              }}
            >
              {featured?.bullet_points && featured.bullet_points.length > 0
                ? featured.bullet_points[0]
                : "Industry-leading active noise cancellation with 30-hour battery life"}
            </p>

            {/* Price & Quick View */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>
                  Best Price
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-navy)" }}>
                  {featured && featured.price !== null
                    ? `₹${featured.price.toLocaleString("en-IN")}`
                    : "₹26,990"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (featured) {
                    onQuickView(featured);
                  } else {
                    onSearch("Sony headphones");
                    onTabChange("explore");
                  }
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                <Eye size={15} />
                <span>Quick View</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "4px" }}>
              Popular Categories
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Explore top rated tech discovered directly across Amazon India and Flipkart.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            style={{
              fontSize: "0.88rem",
              fontWeight: "600",
              color: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View all</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          {POPULAR_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleChipClick(cat.name)}
              className="card-clean"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "14px",
                cursor: "pointer",
                borderRadius: "var(--radius-lg)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "var(--color-royal-blue-light)",
                  color: "var(--color-royal-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cat.icon}
              </div>

              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "3px" }}>
                  {cat.name}
                </h4>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  {cat.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Recommended Products Grid (Real Data) */}
      {recommendedProducts.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "4px" }}>
                Recommended For You
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                Ranked using our multi-dimensional AI scoring engine based on specs, price, and reviews.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("explore")}
              style={{
                fontSize: "0.88rem",
                fontWeight: "600",
                color: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Explore all</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
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

      {/* 4. Shop By Need */}
      <section>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "4px" }}>
            Shop by Need
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            Find curated gear designed specifically for your daily lifestyle and productivity goals.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {SHOP_BY_NEED.map((need, i) => (
            <div
              key={i}
              onClick={() => handleChipClick(need.query)}
              className="card-clean"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                borderRadius: "var(--radius-lg)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#F8FAFC",
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
                    fontSize: "0.74rem",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "#F1F5F9",
                    color: "var(--color-navy)",
                  }}
                >
                  {need.tag}
                </span>
              </div>

              <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "8px" }}>
                {need.title}
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "16px", flex: 1 }}>
                {need.desc}
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.84rem",
                  fontWeight: "600",
                  color: "var(--color-royal-blue)",
                }}
              >
                <span>Find matches</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Why ShopSmart? (4 Feature Cards) */}
      <section
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "48px 36px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 40px auto" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "8px" }}>
            Why ShopSmart?
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Engineered to remove buyer hesitation with transparent comparisons, grounded data, and clear explanations.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "28px",
          }}
        >
          {/* 1. Natural Language Discovery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "var(--color-royal-blue-light)",
                color: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={22} />
            </div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Natural Language Discovery
            </h4>
            <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              Search just like you talk. Ask for "laptop with 16GB RAM for Python under ₹60,000" and our AI parses your intent into precise search parameters.
            </p>
          </div>

          {/* 2. Smart Product Matching */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "var(--color-green-light)",
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={22} />
            </div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Smart Product Matching
            </h4>
            <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              Every product receives an objective match score (0-100) calculated from verified hardware specifications, customer ratings, and budget fit.
            </p>
          </div>

          {/* 3. Easy Product Comparison */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "var(--color-lavender)",
                color: "var(--color-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders size={22} />
            </div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Easy Product Comparison
            </h4>
            <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              Queue up to 6 products from Amazon India and Flipkart side by side. Highlights lowest prices, standout features, and key trade-offs.
            </p>
          </div>

          {/* 4. Budget-Aware Shopping */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "var(--color-orange-light)",
                color: "var(--color-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={22} />
            </div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Budget-Aware Shopping
            </h4>
            <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              Hard budget limits automatically filter out items above your threshold, preventing buyers remorse and ensuring realistic choices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
