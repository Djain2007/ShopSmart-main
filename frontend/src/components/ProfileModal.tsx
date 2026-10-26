import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  Heart,
  History,
  ShieldCheck,
  Check,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenHistory: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  savedCount,
  onOpenSaved,
  onOpenHistory,
}) => {
  const [defaultSort, setDefaultSort] = useState<string>("relevance");
  const [resultsPerPage, setResultsPerPage] = useState<number>(12);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
        animation: "fadeIn 0.18s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card-clean"
        style={{
          maxWidth: "480px",
          width: "100%",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-xl)",
          animation: "popIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
                Shopping Preferences
              </h3>
              <p style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
                Session activity & default search criteria
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "background-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div
              onClick={() => {
                onClose();
                onOpenSaved();
              }}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-rose-border)";
                e.currentTarget.style.backgroundColor = "var(--color-rose-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor = "#F8FAFC";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Heart size={14} color="var(--color-rose)" />
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)" }}>Wishlist</span>
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-navy)" }}>
                {savedCount}
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                Saved products
              </span>
            </div>

            <div
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                e.currentTarget.style.backgroundColor = "var(--color-royal-blue-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.backgroundColor = "#F8FAFC";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <History size={14} color="var(--color-royal-blue)" />
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)" }}>History</span>
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-navy)" }}>
                Active
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                View past searches
              </span>
            </div>
          </div>

          {/* Search Preferences Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Search Defaults
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "500" }}>
                Default Sorting Order
              </label>
              <select
                value={defaultSort}
                onChange={(e) => setDefaultSort(e.target.value)}
                style={{
                  padding: "7px 10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.84rem",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              >
                <option value="relevance">Match Score & Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Customer Rating</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "500" }}>
                Maximum Results per Search
              </label>
              <select
                value={resultsPerPage}
                onChange={(e) => setResultsPerPage(Number(e.target.value))}
                style={{
                  padding: "7px 10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.84rem",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              >
                <option value={8}>8 products (Fastest)</option>
                <option value={12}>12 products (Balanced)</option>
                <option value={18}>18 products (Comprehensive)</option>
              </select>
            </div>
          </div>

          {/* Save Action */}
          <button
            type="button"
            onClick={handleSavePreferences}
            className="btn-primary"
            style={{ width: "100%", padding: "9px" }}
          >
            {savedNotice ? (
              <>
                <Check size={16} />
                <span>Preferences Saved</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>

          {/* Privacy Note */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            <ShieldCheck size={14} color="var(--color-green)" style={{ flexShrink: 0 }} />
            <span>Dual-retailer search queries remain private. No behavioral tracking cookies or telemetry.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
