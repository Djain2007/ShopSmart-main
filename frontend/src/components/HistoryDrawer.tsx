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

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await apiClient.getHistory();
      setHistory(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
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
        backgroundColor: "rgba(16, 24, 47, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1150,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out",
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
          padding: "24px",
          overflow: "hidden",
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
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={20} color="var(--color-royal-blue)" />
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Search History
            </h3>
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

        {/* History items list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "40px 0" }}>
              Loading search history...
            </p>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
              <History size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)" }}>No search history yet</p>
              <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                Queries you search for will automatically be remembered here.
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
                  padding: "12px 16px",
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
                <div>
                  <h5 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-navy)" }}>
                    {item.query}
                  </h5>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    <Clock size={12} />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{item.results_count} products</span>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--color-royal-blue)" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div style={{ paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center", color: "var(--color-rose)" }}
            >
              <Trash2 size={16} />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
