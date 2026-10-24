import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Scale,
  Heart,
  User,
  CheckCircle2,
  AlertTriangle,
  CloudOff,
} from "lucide-react";
import type { SystemStatus } from "../types";

export type NavTab = "home" | "explore" | "assistant" | "compare";

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  compareCount: number;
  savedCount: number;
  status: SystemStatus | null;
  onSearch: (query: string) => void;
  onOpenSaved: () => void;
  onOpenProfile: () => void;
  onOpenAIConfig: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  compareCount,
  savedCount,
  status,
  onSearch,
  onOpenSaved,
  onOpenProfile,
  onOpenAIConfig,
  loading = false,
}) => {
  const [navSearch, setNavSearch] = useState("");

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navSearch.trim() || loading) return;
    onSearch(navSearch.trim());
    onTabChange("explore");
  };

  const getStatusBadge = () => {
    const aiState = status?.ai_status || "unavailable";
    switch (aiState) {
      case "ready":
        return {
          icon: <CheckCircle2 size={13} color="#059669" />,
          label: status?.ai_config.ai_model ? `ScaleMax: ${status.ai_config.ai_model}` : "ScaleMax Ready",
          style: { backgroundColor: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" },
        };
      case "connected":
        return {
          icon: <Sparkles size={13} color="#2563EB" />,
          label: "AI Configured",
          style: { backgroundColor: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE" },
        };
      case "degraded":
        return {
          icon: <AlertTriangle size={13} color="#D97706" />,
          label: "Factual Fallback",
          style: { backgroundColor: "#FFFBEB", color: "#D97706", borderColor: "#FDE68A" },
        };
      case "unavailable":
      default:
        return {
          icon: <CloudOff size={13} color="#64748B" />,
          label: "ScaleMax Offline",
          style: { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" },
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <header
      style={{
        backgroundColor: "var(--color-white)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 3px rgba(16, 24, 47, 0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Left Section: Brand Logo */}
        <div
          onClick={() => onTabChange("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {/* Rounded Royal Blue Square with Sparkle */}
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} fill="#FFFFFF" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.35rem",
                  fontWeight: "800",
                  color: "var(--color-navy)",
                  letterSpacing: "-0.03em",
                  lineHeight: "1.1",
                }}
              >
                Shop<span style={{ color: "var(--color-royal-blue)" }}>Smart</span>
              </span>
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: "700",
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
              }}
            >
              AI SHOPPING ASSISTANT
            </span>
          </div>
        </div>

        {/* Center Search Bar */}
        <form
          onSubmit={handleNavSearchSubmit}
          style={{
            flex: "1 1 340px",
            maxWidth: "520px",
            minWidth: "260px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "4px 6px 4px 14px",
              transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
          >
            <Search size={17} color="var(--color-text-secondary)" style={{ flexShrink: 0, marginRight: "8px" }} />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search products in plain words (e.g. laptop for coding under ₹80,000)"
              style={{
                border: "none",
                background: "none",
                outline: "none",
                width: "100%",
                fontSize: "0.86rem",
                color: "var(--color-text-primary)",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "var(--color-royal-blue)",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "0.82rem",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                flexShrink: 0,
                cursor: "pointer",
                transition: "background-color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-royal-blue-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-royal-blue)")}
            >
              Search
            </button>
          </div>
        </form>

        {/* Main Navigation: Rounded Pill Container */}
        <nav
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#F1F5F9",
            padding: "4px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            gap: "2px",
          }}
        >
          {/* Home */}
          <button
            type="button"
            onClick={() => onTabChange("home")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: activeTab === "home" ? "700" : "600",
              color: activeTab === "home" ? "#FFFFFF" : "var(--color-text-secondary)",
              backgroundColor: activeTab === "home" ? "var(--color-royal-blue)" : "transparent",
              boxShadow: activeTab === "home" ? "0 2px 6px rgba(37, 99, 235, 0.28)" : "none",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
          >
            Home
          </button>

          {/* Explore & Search */}
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: activeTab === "explore" ? "700" : "600",
              color: activeTab === "explore" ? "#FFFFFF" : "var(--color-text-secondary)",
              backgroundColor: activeTab === "explore" ? "var(--color-royal-blue)" : "transparent",
              boxShadow: activeTab === "explore" ? "0 2px 6px rgba(37, 99, 235, 0.28)" : "none",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
          >
            Explore & Search
          </button>

          {/* AI Assistant */}
          <button
            type="button"
            onClick={() => onTabChange("assistant")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: activeTab === "assistant" ? "700" : "600",
              color: activeTab === "assistant" ? "#FFFFFF" : "var(--color-text-secondary)",
              backgroundColor: activeTab === "assistant" ? "var(--color-royal-blue)" : "transparent",
              boxShadow: activeTab === "assistant" ? "0 2px 6px rgba(37, 99, 235, 0.28)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
          >
            <Sparkles size={14} color={activeTab === "assistant" ? "#FFFFFF" : "#6D28D9"} />
            <span>AI Assistant</span>
          </button>

          {/* Compare */}
          <button
            type="button"
            onClick={() => onTabChange("compare")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: activeTab === "compare" ? "700" : "600",
              color: activeTab === "compare" ? "#FFFFFF" : "var(--color-text-secondary)",
              backgroundColor: activeTab === "compare" ? "var(--color-royal-blue)" : "transparent",
              boxShadow: activeTab === "compare" ? "0 2px 6px rgba(37, 99, 235, 0.28)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
          >
            <span>Compare</span>
            {compareCount > 0 && (
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  backgroundColor: activeTab === "compare" ? "#FFFFFF" : "var(--color-royal-blue)",
                  color: activeTab === "compare" ? "var(--color-royal-blue)" : "#FFFFFF",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {compareCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Action Icons & AI Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* AI Status Badge */}
          <button
            type="button"
            onClick={onOpenAIConfig}
            title="Configure ScaleMax AI connection and API Key"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 11px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.76rem",
              fontWeight: "600",
              border: "1px solid",
              cursor: "pointer",
              transition: "transform var(--transition-fast)",
              ...badge.style,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </button>

          {/* Compare Scale Icon */}
          <button
            type="button"
            onClick={() => onTabChange("compare")}
            title="Open Product Comparison"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === "compare" ? "var(--color-lavender)" : "var(--color-white)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              color: activeTab === "compare" ? "var(--color-royal-blue)" : "var(--color-navy)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <Scale size={18} />
            {compareCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "var(--color-royal-blue)",
                  color: "#FFFFFF",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                {compareCount}
              </span>
            )}
          </button>

          {/* Wishlist Heart Icon */}
          <button
            type="button"
            onClick={onOpenSaved}
            title="Wishlist & Saved Items"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              color: savedCount > 0 ? "var(--color-rose)" : "var(--color-navy)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-rose)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <Heart size={18} fill={savedCount > 0 ? "var(--color-rose)" : "none"} />
            {savedCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "var(--color-rose)",
                  color: "#FFFFFF",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                {savedCount}
              </span>
            )}
          </button>

          {/* Profile User Icon */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="User Profile & Settings"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-navy)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.color = "var(--color-royal-blue)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-navy)";
            }}
          >
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
