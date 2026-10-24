import React from "react";
import { Sparkles, ShieldCheck, Zap, Bot, ArrowUpRight } from "lucide-react";
import type { NavTab } from "./Header";

interface FooterProps {
  onTabChange: (tab: NavTab) => void;
  onOpenAIConfig: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange, onOpenAIConfig }) => {
  return (
    <footer
      style={{
        backgroundColor: "var(--color-white)",
        borderTop: "1px solid var(--color-border)",
        marginTop: "80px",
        padding: "60px 24px 36px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "40px",
          marginBottom: "48px",
        }}
      >
        {/* Brand Column */}
        <div style={{ maxWidth: "340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                backgroundColor: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <Sparkles size={18} fill="#FFFFFF" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                fontWeight: "800",
                color: "var(--color-navy)",
              }}
            >
              Shop<span style={{ color: "var(--color-royal-blue)" }}>Smart</span>
            </span>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.6",
              marginBottom: "18px",
            }}
          >
            Shopping made smarter. An AI-powered natural language shopping assistant that crawls live listings on Amazon India & Flipkart and explains rankings with factual evidence.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge-clean badge-blue">
              <Zap size={12} />
              ScaleMax AI Provider
            </span>
            <span className="badge-clean badge-green">
              <ShieldCheck size={12} />
              Verified Factual
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h4
            style={{
              fontSize: "0.92rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "18px",
            }}
          >
            Navigation
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            <li>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onTabChange("home");
                }}
                style={{
                  fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                AI Shopping Assistant
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
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Side-by-Side Comparison
              </button>
            </li>
          </ul>
        </div>

        {/* Supported Retailers */}
        <div>
          <h4
            style={{
              fontSize: "0.92rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "18px",
            }}
          >
            Live Retailers
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            <li>
              <a
                href="https://www.amazon.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FF9900")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                <span>Amazon India (amazon.in)</span>
                <ArrowUpRight size={14} />
              </a>
            </li>
            <li>
              <a
                href="https://www.flipkart.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2874F0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                <span>Flipkart (flipkart.com)</span>
                <ArrowUpRight size={14} />
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenAIConfig}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9rem",
                  color: "var(--color-purple)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <Bot size={15} />
                <span>ScaleMax AI Settings</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Shopping Principles */}
        <div>
          <h4
            style={{
              fontSize: "0.92rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "18px",
            }}
          >
            Principles
          </h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.6",
              marginBottom: "12px",
            }}
          >
            Zero hallucinations. Every recommendation, spec, and score is strictly grounded in real retailer listing data and transparent matching criteria.
          </p>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            ShopSmart 2.0 · Natural Language Shopping Assistant
          </span>
        </div>
      </div>

      {/* Copyright Bar */}
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          paddingTop: "24px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.82rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>© 2026 ShopSmart — AI Shopping Assistant. All rights reserved.</span>
        <span>Built with React, TypeScript & FastAPI</span>
      </div>
    </footer>
  );
};
