import {
  X,
  User,
  Heart,
  History,
  Bot,
  ShieldCheck,
  Settings,
} from "lucide-react";
import type { SystemStatus } from "../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenHistory: () => void;
  onOpenAIConfig: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  status,
  savedCount,
  onOpenSaved,
  onOpenHistory,
  onOpenAIConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(16, 24, 47, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card-clean"
        style={{
          maxWidth: "520px",
          width: "100%",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-xl)",
          animation: "popIn 0.22s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
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
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "var(--color-royal-blue-light)",
                color: "var(--color-royal-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-navy)" }}>
                User Profile & System
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                ShopSmart Session Preferences & Engine Status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div
              onClick={() => {
                onClose();
                onOpenSaved();
              }}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-rose)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Heart size={16} color="var(--color-rose)" />
                <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-navy)" }}>Wishlist</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-navy)" }}>
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
                padding: "16px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <History size={16} color="var(--color-royal-blue)" />
                <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-navy)" }}>History</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-navy)" }}>
                Logged
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                View past queries
              </span>
            </div>
          </div>

          {/* AI Connection Status Box */}
          <div
            style={{
              backgroundColor: "var(--color-lavender)",
              border: "1px solid var(--color-lavender-border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bot size={18} color="var(--color-purple)" />
                <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--color-purple)" }}>
                  AI Inference Engine
                </span>
              </div>
              <span className="badge-clean badge-purple" style={{ fontSize: "0.72rem" }}>
                {status?.ai_status?.toUpperCase() || "OFFLINE"}
              </span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--color-navy)", lineHeight: "1.5", marginBottom: "12px" }}>
              {status?.ai_status === "ready"
                ? `Connected to ScaleMax AI (${status.ai_config?.ai_model || "cloud model"}). Generating grounded rankings and natural language explanations.`
                : "Operating in High-Performance Factual Fallback Mode. Rule-based intent extraction, scraper orchestration, and factual scoring remain 100% active."}
            </p>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAIConfig();
              }}
              className="btn-secondary"
              style={{
                width: "100%",
                fontSize: "0.84rem",
                padding: "8px 14px",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Settings size={14} />
              <span>Configure ScaleMax AI & API Key</span>
            </button>
          </div>

          {/* Principles */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
            <ShieldCheck size={16} color="var(--color-green)" />
            <span>Dual-retailer crawling without user tracking or data selling.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
