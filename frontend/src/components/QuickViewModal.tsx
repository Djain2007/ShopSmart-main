import React from "react";
import {
  X,
  Star,
  ExternalLink,
  Heart,
  Scale,
  Sparkles,
  Check,
} from "lucide-react";
import type { UnifiedProduct } from "../types";

interface QuickViewModalProps {
  product: UnifiedProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (product: UnifiedProduct) => void;
  onToggleSave: (product: UnifiedProduct) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  isSelectedForCompare,
  onToggleCompare,
  onToggleSave,
}) => {
  if (!isOpen || !product) return null;

  const priceFormatted = product.price !== null
    ? `₹${product.price.toLocaleString("en-IN")}`
    : "Price Unavailable";

  const listPriceFormatted = product.list_price !== null
    ? `₹${product.list_price.toLocaleString("en-IN")}`
    : null;

  const discountPercent = product.price && product.list_price && product.list_price > product.price
    ? Math.round(((product.list_price - product.price) / product.list_price) * 100)
    : null;

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
        zIndex: 1200,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card-clean"
        style={{
          maxWidth: "880px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-xl)",
          animation: "popIn 0.22s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={`badge-clean ${product.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}>
              {product.source === "amazon.in" ? "Amazon India" : "Flipkart"}
            </span>
            {product.score !== undefined && (
              <span className="badge-clean badge-blue">
                <Sparkles size={12} />
                Match Score: {Math.round(product.score)}/100
              </span>
            )}
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
              transition: "background-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "28px 24px",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "minmax(260px, 340px) 1fr",
            gap: "32px",
          }}
        >
          {/* Left Column: Image & Quick Actions */}
          <div>
            <div
              style={{
                width: "100%",
                height: "300px",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Photo unavailable
                </span>
              )}
            </div>

            {/* Actions: Save & Compare */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => onToggleCompare(product)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.86rem",
                  fontWeight: "600",
                  backgroundColor: isSelectedForCompare ? "var(--color-royal-blue)" : "#FFFFFF",
                  color: isSelectedForCompare ? "#FFFFFF" : "var(--color-navy)",
                  border: isSelectedForCompare ? "1px solid var(--color-royal-blue)" : "1px solid var(--color-border)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {isSelectedForCompare ? (
                  <>
                    <Check size={16} />
                    <span>Compared</span>
                  </>
                ) : (
                  <>
                    <Scale size={16} />
                    <span>Compare</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(product)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: product.is_saved ? "var(--color-rose-light)" : "#FFFFFF",
                  color: product.is_saved ? "var(--color-rose)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                title={product.is_saved ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={product.is_saved ? "var(--color-rose)" : "none"} />
              </button>
            </div>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{
                width: "100%",
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              <span>View on {product.source === "amazon.in" ? "Amazon.in" : "Flipkart"}</span>
              <ExternalLink size={15} />
            </a>
          </div>

          {/* Right Column: Specifications & AI Analysis */}
          <div>
            {product.brand && (
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  color: "var(--color-royal-blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {product.brand}
              </span>
            )}

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                lineHeight: "1.4",
                marginBottom: "14px",
              }}
            >
              {product.title}
            </h3>

            {/* Price Row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "1.65rem",
                  fontWeight: "800",
                  color: "var(--color-navy)",
                }}
              >
                {priceFormatted}
              </span>

              {listPriceFormatted && (
                <span
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--color-text-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  {listPriceFormatted}
                </span>
              )}

              {discountPercent && (
                <span className="badge-clean badge-orange" style={{ fontWeight: "700" }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Rating & Reviews */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              {product.rating !== null ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: "var(--color-green-light)",
                    color: "var(--color-green)",
                    border: "1px solid var(--color-green-border)",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                  }}
                >
                  <Star size={13} fill="currentColor" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  Unrated
                </span>
              )}

              {product.review_count !== null && (
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                  {product.review_count.toLocaleString("en-IN")} customer ratings
                </span>
              )}
            </div>

            {/* AI Explanation Pill */}
            {product.explanation && (
              <div
                style={{
                  backgroundColor: "var(--color-lavender)",
                  border: "1px solid var(--color-lavender-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Sparkles size={16} color="var(--color-purple)" />
                  <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--color-purple)" }}>
                    AI Grounded Match Analysis
                  </span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--color-navy)", lineHeight: "1.5", marginBottom: "12px" }}>
                  {product.explanation.summary}
                </p>

                {product.explanation.pros.length > 0 && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-green)", textTransform: "uppercase" }}>
                      Key Strengths:
                    </span>
                    <ul style={{ paddingLeft: "18px", marginTop: "4px", fontSize: "0.82rem", color: "var(--color-text-primary)" }}>
                      {product.explanation.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.explanation.cons.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-orange)", textTransform: "uppercase" }}>
                      Trade-offs:
                    </span>
                    <ul style={{ paddingLeft: "18px", marginTop: "4px", fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                      {product.explanation.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Key Bullet Points */}
            {product.bullet_points && product.bullet_points.length > 0 && (
              <div>
                <h5 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "10px" }}>
                  Product Features & Specifications
                </h5>
                <ul
                  style={{
                    paddingLeft: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.84rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: "1.5",
                  }}
                >
                  {product.bullet_points.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
