import React, { useEffect, useState } from "react";
import { X, History, Trash2, ArrowRight, Clock } from "lucide-react";
import type { HistoryItem } from "../types";
import { apiClient } from "../api/client";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const items = await apiClient.getHistory();
        if (!cancelled) {
          setHistory(items);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear your search history?")) {
      await apiClient.clearHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1150,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.18s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 24px",
          overflow: "hidden",
          animation: "popIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-royal-blue-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-royal-blue)",
              }}
            >
              <History size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
                Search History
              </h3>
              <span style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
                {history.length} logged searches
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close History"
            style={{
              width: "30px",
              height: "30px",
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

        {/* History items list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "0.85rem" }}>Loading search history...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 16px", color: "var(--color-text-muted)" }}>
              <History size={36} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
              <p style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)" }}>No search history yet</p>
              <p style={{ fontSize: "0.8rem", marginTop: "4px", color: "var(--color-text-secondary)", maxWidth: "260px", margin: "4px auto 0" }}>
                Queries you search for in Explore will be remembered here for easy 1-click rerun.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onClick={() => {
                  onSelectQuery(item.query);
                  onClose();
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
                <div style={{ minWidth: 0, flex: 1, paddingRight: "8px" }}>
                  <h5
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: "600",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.query}
                  >
                    {item.query}
                  </h5>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                      marginTop: "3px",
                    }}
                  >
                    <Clock size={11} />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{item.results_count} products</span>
                  </div>
                </div>
                <ArrowRight size={15} color="var(--color-royal-blue)" style={{ flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div style={{ paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center", color: "var(--color-rose)" }}
            >
              <Trash2 size={15} />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

