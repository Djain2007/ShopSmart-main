import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Heart,
  History,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";

export type NavTab = "home" | "explore" | "assistant" | "compare";

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  compareCount: number;
  savedCount: number;
  onSearch: (query: string) => void;
  onOpenSaved: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  compareCount,
  savedCount,
  onSearch,
  onOpenSaved,
  onOpenHistory,
  onOpenProfile,
  loading = false,
}) => {
  const [navSearch, setNavSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navSearch.trim() || loading) return;
    onSearch(navSearch.trim());
    onTabChange("explore");
    setMobileMenuOpen(false);
  };

  const navItems: { id: NavTab; label: string; count?: number }[] = [
    { id: "home", label: "Home" },
    { id: "explore", label: "Explore & Search" },
    { id: "assistant", label: "AI Assistant" },
    { id: "compare", label: "Compare", count: compareCount },
  ];

  return (
    <header
      style={{
        backgroundColor: "var(--color-white)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 20px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left: Brand Wordmark */}
        <div
          onClick={() => {
            onTabChange("home");
            setMobileMenuOpen(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
            }}
          >
            <ShoppingBag size={18} strokeWidth={2.2} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.18rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                letterSpacing: "-0.03em",
              }}
            >
              Shop<span style={{ color: "var(--color-royal-blue)" }}>Smart</span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "4px",
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.86rem",
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? "var(--color-royal-blue)" : "var(--color-text-secondary)",
                  backgroundColor: isActive ? "var(--color-royal-blue-light)" : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all var(--transition-fast)",
                  cursor: "pointer",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
                    e.currentTarget.style.color = "var(--color-navy)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      backgroundColor: isActive ? "var(--color-royal-blue)" : "var(--color-bg-muted)",
                      color: isActive ? "#FFFFFF" : "var(--color-navy)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Center-Right: Compact Nav Search Input */}
        <form
          onSubmit={handleNavSearchSubmit}
          style={{
            display: "none",
            alignItems: "center",
            flex: "1 1 260px",
            maxWidth: "360px",
          }}
          className="desktop-search"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              backgroundColor: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "5px 10px",
              transition: "all var(--transition-fast)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Search size={15} color="var(--color-text-muted)" style={{ marginRight: "8px", flexShrink: 0 }} />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search Amazon & Flipkart..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "0.84rem",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </form>

        {/* Right Section: Customer Shopping Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Search History Action */}
          <button
            type="button"
            onClick={onOpenHistory}
            title="Search History"
            aria-label="Search History"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
              e.currentTarget.style.color = "var(--color-navy)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <History size={16} />
          </button>

          {/* Wishlist Saved Action */}
          <button
            type="button"
            onClick={onOpenSaved}
            title="Saved Items"
            aria-label={`Saved Items (${savedCount})`}
            style={{
              height: "34px",
              padding: "0 10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: savedCount > 0 ? "var(--color-rose)" : "var(--color-text-secondary)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Heart size={15} fill={savedCount > 0 ? "var(--color-rose)" : "none"} />
            <span style={{ color: "var(--color-navy)" }}>{savedCount}</span>
          </button>

          {/* Preferences Action */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Shopping Preferences"
            aria-label="Shopping Preferences"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
              e.currentTarget.style.color = "var(--color-navy)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Mobile Navigation Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-navy)",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-white)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
          className="mobile-menu"
        >
          <form onSubmit={handleNavSearchSubmit} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                backgroundColor: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
              }}
            >
              <Search size={16} color="var(--color-text-muted)" style={{ marginRight: "8px" }} />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search Amazon & Flipkart..."
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.88rem",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.9rem",
                    fontWeight: isActive ? "600" : "500",
                    color: isActive ? "var(--color-royal-blue)" : "var(--color-navy)",
                    backgroundColor: isActive ? "var(--color-royal-blue-light)" : "transparent",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        backgroundColor: "var(--color-royal-blue)",
                        color: "#FFFFFF",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Responsive Inline CSS for Desktop vs Mobile Header Visibility */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-search {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
        @media (max-width: 859px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-search {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
