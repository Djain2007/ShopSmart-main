import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
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
    label: "Travel Headphones",
    prompt: "I fly frequently on long international flights. What are the best noise-cancelling headphones under ₹30,000 with long battery life and comfortable earcups?",
    icon: <Headphones size={15} />,
  },
  {
    label: "Coding Laptop",
    prompt: "I am a full-stack developer who runs Docker and local LLMs. What laptop has at least 16GB RAM, an ergonomic keyboard, and good thermals under ₹80,000?",
    icon: <Laptop size={15} />,
  },
  {
    label: "Running Shoes & Fitness",
    prompt: "I run 5km daily on paved asphalt roads. Recommend durable running gear or smart fitness watches with accurate heart rate tracking.",
    icon: <Activity size={15} />,
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
        "Welcome to the ShopSmart Conversational Shopping Assistant. Describe your lifestyle, work demands, and budget constraints in everyday language. I will analyze real product specifications, compare options across Amazon India & Flipkart, and explain which product offers the greatest value.",
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
            "I encountered an issue connecting to the AI inference service. " +
            (err.message || "Please verify that the backend and ScaleMax AI are configured."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1080px", margin: "0 auto" }}>
      {/* 1. Page Header */}
      <section style={{ textAlign: "center", padding: "12px 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--color-lavender)",
            color: "var(--color-purple)",
            border: "1px solid var(--color-lavender-border)",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: "700",
            marginBottom: "16px",
          }}
        >
          <Sparkles size={14} />
          <span>Conversational Shopping Assistant</span>
        </div>

        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: "800",
            color: "var(--color-navy)",
            marginBottom: "12px",
            letterSpacing: "-0.03em",
          }}
        >
          Conversational intelligence in action.
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--color-text-secondary)",
            maxWidth: "680px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Describe your lifestyle, constraints, and environment. ShopSmart helps you discover products that fit your needs.
        </p>
      </section>

      {/* 2. Example Scenarios Chips */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-text-muted)" }}>
          Example Scenarios:
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
              borderRadius: "var(--radius-full)",
              padding: "7px 16px",
              fontSize: "0.82rem",
              fontWeight: "600",
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
      </section>

      {/* 3. Conversation Panel */}
      <section
        className="card-clean"
        style={{
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          minHeight: "520px",
          maxHeight: "700px",
          backgroundColor: "var(--color-white)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--color-lavender)",
                color: "var(--color-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-navy)" }}>
                ShopSmart AI Engine
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                {currentProducts.length > 0
                  ? `Contextually grounded in ${currentProducts.length} discovered products`
                  : "Ready to assist with questions across tech & lifestyle catalogs"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
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
                  gap: "12px",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: isUser ? "80%" : "88%",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-lavender)",
                      color: "var(--color-purple)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: isUser ? "var(--color-royal-blue)" : "var(--color-bg-subtle)",
                    color: isUser ? "#FFFFFF" : "var(--color-text-primary)",
                    padding: "14px 18px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: "0.92rem",
                    lineHeight: "1.6",
                    border: isUser ? "none" : "1px solid var(--color-border)",
                    boxShadow: isUser ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "var(--color-navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-lavender)",
                  color: "var(--color-purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div
                style={{
                  backgroundColor: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border)",
                  padding: "12px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  fontSize: "0.88rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Evaluating specifications and matching evidence...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Followups */}
        {suggestedFollowups.length > 0 && !loading && (
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "#F8FAFC",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-text-muted)", flexShrink: 0 }}>
              Follow-up:
            </span>
            {suggestedFollowups.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(f)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
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
            padding: "14px 20px",
            backgroundColor: "var(--color-white)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about specs, budget, battery life, or compare products..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.92rem",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-royal-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </form>
      </section>

      {/* 4. Inline Product Recommendations Shelf (if context products exist) */}
      {currentProducts.length > 0 && (
        <section>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "4px" }}>
              Active Discovered Products in Conversation Context
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              The AI assistant references these exact products from your search results.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {currentProducts.slice(0, 4).map((p) => {
              const isCompared = selectedCompareIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="card-clean"
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    ) : (
                      <Sparkles size={20} color="var(--color-royal-blue)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-royal-blue)", textTransform: "uppercase" }}>
                      {p.brand || p.source}
                    </span>
                    <h5
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        color: "var(--color-navy)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                      title={p.title}
                    >
                      {p.title}
                    </h5>
                    <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--color-navy)" }}>
                      {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "₹--"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(p)}
                      title="Quick View"
                      style={{
                        padding: "5px",
                        borderRadius: "6px",
                        backgroundColor: "#F1F5F9",
                        color: "var(--color-navy)",
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleCompare(p)}
                      title={isCompared ? "Compared" : "Add to Compare"}
                      style={{
                        padding: "5px",
                        borderRadius: "6px",
                        backgroundColor: isCompared ? "var(--color-royal-blue)" : "#F1F5F9",
                        color: isCompared ? "#FFFFFF" : "var(--color-navy)",
                        cursor: "pointer",
                      }}
                    >
                      {isCompared ? <Check size={14} /> : <Scale size={14} />}
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
