import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Headphones,
  Laptop,
  Activity,
  Eye,
  Scale,
  Check,
  ShieldCheck,
} from "lucide-react";
import type { ChatTurn, UnifiedProduct } from "../types";
import { apiClient } from "../api/client";
import { QuickViewModal } from "../components/QuickViewModal";

interface AIAssistantPageProps {
  currentProducts: UnifiedProduct[];
  selectedCompareIds: string[];
  onToggleCompare: (product: UnifiedProduct) => void;
  onToggleSave: (product: UnifiedProduct) => void;
  onExecuteSearch: (query: string) => void;
}

const SCENARIOS = [
  {
    label: "Noise Cancelling Headphones",
    prompt: "I fly frequently on long international flights. What are the best noise-cancelling headphones under ₹30,000 with long battery life and comfortable earcups?",
    icon: <Headphones size={14} />,
  },
  {
    label: "Developer Coding Laptop",
    prompt: "I am a full-stack developer who runs Docker and local LLMs. What laptop has at least 16GB RAM, an ergonomic keyboard, and good thermals under ₹80,000?",
    icon: <Laptop size={14} />,
  },
  {
    label: "Durable Running Shoes",
    prompt: "I run 5km daily on paved asphalt roads. Recommend durable running gear with cushioned soles under ₹3,000.",
    icon: <Activity size={14} />,
  },
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  currentProducts,
  selectedCompareIds,
  onToggleCompare,
  onToggleSave,
  onExecuteSearch,
}) => {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "Welcome to the ShopSmart Shopping Assistant. Describe your use case, technical requirements, or budget in plain words. I analyze verified product specifications from Amazon India and Flipkart to help you make confident buying decisions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    "Which option has the best battery life?",
    "Compare the top 2 products by value for money",
    "Are there any notable trade-offs with the #1 match?",
  ]);
  const [quickViewProduct, setQuickViewProduct] = useState<UnifiedProduct | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userTurn: ChatTurn = { role: "user", content: text };
    const newHistory = [...messages, userTurn];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.chat({
        message: text,
        history: newHistory.slice(-10),
        productIds: currentProducts.slice(0, 15).map((p) => p.id),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
      if (res.suggested_followups && res.suggested_followups.length > 0) {
        setSuggestedFollowups(res.suggested_followups);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI assistance is temporarily unavailable. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "880px", margin: "0 auto" }}>
      {/* 1. Page Header */}
      <section style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <span className="badge-clean badge-blue">
            <ShieldCheck size={12} />
            Verified Spec Assistant
          </span>
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: "var(--color-navy)",
            marginBottom: "6px",
            letterSpacing: "-0.025em",
          }}
        >
          Conversational Shopping Assistant
        </h1>

        <p
          style={{
            fontSize: "0.92rem",
            color: "var(--color-text-secondary)",
            lineHeight: "1.5",
          }}
        >
          Ask detailed questions about hardware specifications, trade-offs, and pricing across live Amazon India and Flipkart listings.
        </p>
      </section>

      {/* 2. Example Scenarios Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-text-muted)" }}>
          Quick Prompts:
        </span>
        {SCENARIOS.map((sc, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              handleSend(sc.prompt);
              if (onExecuteSearch && currentProducts.length === 0) {
                onExecuteSearch(sc.label);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "5px 10px",
              fontSize: "0.78rem",
              fontWeight: "500",
              color: "var(--color-navy)",
              boxShadow: "var(--shadow-xs)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
              e.currentTarget.style.color = "var(--color-royal-blue)";
              e.currentTarget.style.backgroundColor = "var(--color-royal-blue-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-navy)";
              e.currentTarget.style.backgroundColor = "var(--color-white)";
            }}
          >
            {sc.icon}
            <span>{sc.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Conversation Card */}
      <section
        className="card-clean"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "480px",
          maxHeight: "680px",
          backgroundColor: "var(--color-white)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--color-bg-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-royal-blue)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--color-navy)" }}>
                Shopping Inference Session
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                {currentProducts.length > 0
                  ? `Active catalog context: ${currentProducts.length} verified products`
                  : "Ready for shopping questions"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: isUser ? "85%" : "90%",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-royal-blue-light)",
                      color: "var(--color-royal-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={15} />
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: isUser ? "var(--color-royal-blue)" : "var(--color-bg-subtle)",
                    color: isUser ? "#FFFFFF" : "var(--color-text-primary)",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.88rem",
                    lineHeight: "1.55",
                    border: isUser ? "none" : "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-xs)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-navy)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignSelf: "flex-start" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-royal-blue-light)",
                  color: "var(--color-royal-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Loader2 size={15} className="animate-spin" />
              </div>
              <div
                style={{
                  backgroundColor: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.84rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Analyzing product specs and verifying trade-offs...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Followups */}
        {suggestedFollowups.length > 0 && !loading && (
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--color-bg-subtle)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
            }}
          >
            <span style={{ fontSize: "0.74rem", fontWeight: "600", color: "var(--color-text-muted)", flexShrink: 0 }}>
              Suggestions:
            </span>
            {suggestedFollowups.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(f)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xs)",
                  padding: "3px 8px",
                  fontSize: "0.76rem",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-royal-blue)";
                  e.currentTarget.style.color = "var(--color-royal-blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--color-white)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about specs, compare features, or inquire about trade-offs..."
            disabled={loading}
            style={{
              flex: 1,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              fontSize: "0.88rem",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-royal-blue)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)" }}
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </section>

      {/* 4. Active Catalog Context Products */}
      {currentProducts.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--color-navy)" }}>
                Active Context Listings ({currentProducts.length})
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                The assistant answers questions grounded in these products.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {currentProducts.slice(0, 4).map((p) => {
              const isComp = selectedCompareIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="card-clean"
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      backgroundColor: "#FFFFFF",
                      flexShrink: 0,
                    }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <Headphones size={18} color="var(--color-text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: "var(--color-navy)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={p.title}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
                      {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "Price unavailable"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => onToggleCompare(p)}
                      title={isComp ? "Remove from comparison" : "Add to comparison"}
                      style={{
                        padding: "5px",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: isComp ? "var(--color-royal-blue)" : "var(--color-bg-subtle)",
                        color: isComp ? "#FFFFFF" : "var(--color-navy)",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                      }}
                    >
                      {isComp ? <Check size={12} strokeWidth={2.5} /> : <Scale size={12} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(p)}
                      title="Quick View"
                      style={{
                        padding: "5px",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: "var(--color-white)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={quickViewProduct !== null}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        isSelectedForCompare={quickViewProduct ? selectedCompareIds.includes(quickViewProduct.id) : false}
        onToggleCompare={onToggleCompare}
        onToggleSave={onToggleSave}
      />
    </div>
  );
};
