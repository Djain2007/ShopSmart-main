import React, { useState } from "react";
import { X, CheckCircle, AlertCircle, RefreshCw, Sparkles, ShieldCheck, Key } from "lucide-react";
import type { SystemStatus } from "../types";
import { apiClient } from "../api/client";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
  onConfigSaved: () => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  status,
  onConfigSaved,
}) => {
  const [baseUrl, setBaseUrl] = useState(
    status?.ai_config.ai_base_url || "https://api.scalemax.pro/token/v1"
  );
  const [model, setModel] = useState(status?.ai_config.ai_model || "");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setFeedback(null);

    try {
      const res = await apiClient.updateAIConfig(
        baseUrl.trim() || undefined,
        apiKey.trim() || undefined,
        model.trim() || undefined
      );

      if (res.ai_status === "ready") {
        setFeedback({
          type: "success",
          msg: `Connected! ScaleMax AI is configured and ready with model: ${res.ai_config?.ai_model || model || "configured model"}.`,
        });
      } else if (res.ai_status === "connected") {
        setFeedback({
          type: "info",
          msg: "Configuration saved! Provider is configured.",
        });
      } else {
        setFeedback({
          type: "error",
          msg: "AI configuration updated, but service is currently unconfigured or unreachable. Please check API key and model ID.",
        });
      }
      onConfigSaved();
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err.message || "Failed to update ScaleMax AI configuration.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(16, 24, 47, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card-clean"
        style={{
          maxWidth: "600px",
          width: "100%",
          padding: "28px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-xl)",
          borderRadius: "var(--radius-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
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

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "var(--color-royal-blue-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-royal-blue)",
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--color-navy)" }}>
              ScaleMax AI Provider Configuration
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
              Configure your ScaleMax OpenAI-compatible API connection for shopping intelligence
            </p>
          </div>
        </div>

        {/* Current Status Banner */}
        <div
          style={{
            backgroundColor: "#F8FAFC",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            margin: "16px 0",
            fontSize: "0.85rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <span style={{ color: "var(--color-text-secondary)" }}>ScaleMax Status: </span>
            <strong
              style={{
                color:
                  status?.ai_status === "ready"
                    ? "var(--color-green)"
                    : status?.ai_status === "connected"
                    ? "var(--color-royal-blue)"
                    : status?.ai_status === "degraded"
                    ? "var(--color-orange)"
                    : "var(--color-text-secondary)",
              }}
            >
              {status?.ai_status ? status.ai_status.toUpperCase() : "OFFLINE"}
            </strong>
            {status?.ai_config.ai_model && (
              <span style={{ marginLeft: "8px", color: "var(--color-text-secondary)", fontSize: "0.78rem" }}>
                ({status.ai_config.ai_model})
              </span>
            )}
          </div>
          {status?.ai_config.api_key_set && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-green)", fontSize: "0.8rem" }}>
              <ShieldCheck size={14} />
              <span>Key Configured ({status.ai_config.api_key_masked})</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleTestAndSave}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px" }}>
              ScaleMax Base URL
            </label>
            <input
              type="url"
              placeholder="https://api.scalemax.pro/token/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Standard token-pack endpoint: <code>https://api.scalemax.pro/token/v1</code>
            </span>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px" }}>
              Model Name (<code>SCALEMAX_MODEL</code>)
            </label>
            <input
              type="text"
              placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet, deepseek-chat"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              The exact model ID available in your ScaleMax token-pack catalog.
            </span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px" }}>
              API Key (<code>SCALEMAX_API_KEY</code>)
            </label>
            <input
              type="password"
              placeholder={status?.ai_config.api_key_set ? "•••••••••••••••• (leave blank to keep current)" : "Enter your ScaleMax API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Stored server-side only in your local backend environment. Never exposed to the browser.
            </span>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                marginBottom: "16px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor:
                  feedback.type === "success"
                    ? "var(--color-green-light)"
                    : feedback.type === "info"
                    ? "var(--color-royal-blue-light)"
                    : "var(--color-rose-light)",
                color:
                  feedback.type === "success"
                    ? "var(--color-green)"
                    : feedback.type === "info"
                    ? "var(--color-royal-blue)"
                    : "var(--color-rose)",
                border: "1px solid currentColor",
              }}
            >
              {feedback.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.msg}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button type="submit" disabled={testing} className="btn-primary">
              {testing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Save & Connect</span>
              )}
            </button>
          </div>
        </form>

        {/* Informational Guidance Box */}
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "14px",
            fontSize: "0.8rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--color-navy)", fontWeight: "700" }}>
            <Key size={14} />
            <span>ScaleMax Integration Details</span>
          </div>
          <p style={{ lineHeight: "1.6", margin: "4px 0" }}>
            ShopSmart communicates directly with ScaleMax via the official OpenAI-compatible token-pack API (
            <code>https://api.scalemax.pro/token/v1</code>).
          </p>
          <p style={{ lineHeight: "1.6", margin: "4px 0" }}>
            <strong>Cost & Performance Control:</strong> Only top candidate products (max 12) and key specifications are passed to the model. Real prices and ratings are always verified from retailers.
          </p>
        </div>
      </div>
    </div>
  );
};
