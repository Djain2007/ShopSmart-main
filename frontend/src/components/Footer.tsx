import React from "react";
import { ShoppingBag, ShieldCheck, Zap, SlidersHorizontal } from "lucide-react";
import type { NavTab } from "./Header";

interface FooterProps {
  onTabChange: (tab: NavTab) => void;
  onOpenPreferences: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange, onOpenPreferences }) => {
  return (
    <footer
      style={{
        backgroundColor: "var(--color-white)",
        borderTop: "1px solid var(--color-border)",
        marginTop: "64px",
        padding: "48px 24px 28px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "36px",
          marginBottom: "36px",
        }}
      >
        {/* Brand Column */}
        <div style={{ maxWidth: "340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <ShoppingBag size={16} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.15rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                letterSpacing: "-0.02em",
              }}
            >
              Shop<span style={{ color: "var(--color-royal-blue)" }}>Smart</span>
            </span>
          </div>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.55",
              marginBottom: "14px",
            }}
          >
            Factual shopping intelligence. Discovers live product listings across Amazon India and Flipkart, extracting real specifications and verifying prices.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge-clean badge-blue" style={{ fontSize: "0.72rem" }}>
              <Zap size={11} />
              Dual-Retailer Discovery
            </span>
            <span className="badge-clean badge-green" style={{ fontSize: "0.72rem" }}>
              <ShieldCheck size={11} />
              Factual Grounding
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            Navigation
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onTabChange("home");
                }}
                style={{
                  fontSize: "0.84rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onTabChange("explore");
                }}
                style={{
                  fontSize: "0.84rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Explore & Search
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onTabChange("assistant");
                }}
                style={{
                  fontSize: "0.84rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Shopping Assistant
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onTabChange("compare");
                }}
                style={{
                  fontSize: "0.84rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Product Comparison
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Controls */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            Preferences
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              <button
                type="button"
                onClick={onOpenPreferences}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.84rem",
                  color: "var(--color-royal-blue)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Search Preferences</span>
              </button>
            </li>
            <li>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Currency: Indian Rupee (INR ₹)
              </span>
            </li>
            <li>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Sources: Amazon India · Flipkart
              </span>
            </li>
          </ul>
        </div>

        {/* Shopping Principles */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            Principles
          </h4>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.55",
              marginBottom: "10px",
            }}
          >
            Zero fabricated data. Every recommendation, spec, and score is strictly grounded in real retailer listing data and transparent matching criteria.
          </p>
          <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            ShopSmart · Production E-Commerce Intelligence
          </span>
        </div>
      </div>

      {/* Copyright Bar */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingTop: "20px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "0.78rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>© 2026 ShopSmart. Factual Shopping Intelligence.</span>
        <span>React 18 · TypeScript · FastAPI</span>
      </div>
    </footer>
  );
};
