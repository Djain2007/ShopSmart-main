import React from "react";
import {
  X,
  Star,
  ExternalLink,
  Heart,
  Scale,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
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
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: "16px",
        animation: "fadeIn 0.18s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="card-clean"
        style={{
          maxWidth: "840px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          animation: "popIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={`badge-clean ${product.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}>
              {product.source === "amazon.in" ? "Amazon India" : "Flipkart"}
            </span>
            {product.score !== undefined && (
              <span className="badge-clean badge-blue">
                Match: {Math.round(product.score)}%
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close product view"
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

        {/* Modal Body */}
        <div
          style={{
            padding: "24px 20px",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "minmax(240px, 320px) 1fr",
            gap: "28px",
          }}
        >
          {/* Left Column: Image & Quick Actions */}
          <div>
            <div
              style={{
                width: "100%",
                height: "280px",
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
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
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  Photo unavailable
                </span>
              )}
            </div>

            {/* Actions: Save & Compare */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => onToggleCompare(product)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.82rem",
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
                    <Check size={14} />
                    <span>Compared</span>
                  </>
                ) : (
                  <>
                    <Scale size={14} />
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
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: product.is_saved ? "var(--color-rose-light)" : "#FFFFFF",
                  color: product.is_saved ? "var(--color-rose)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                title={product.is_saved ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={16} fill={product.is_saved ? "var(--color-rose)" : "none"} />
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
                fontSize: "0.85rem",
                padding: "9px 14px",
              }}
            >
              <span>View on {product.source === "amazon.in" ? "Amazon.in" : "Flipkart"}</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Right Column: Specifications & Match Analysis */}
          <div>
            {product.brand && (
              <span
                style={{
                  fontSize: "0.76rem",
                  fontWeight: "700",
                  color: "var(--color-royal-blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {product.brand}
              </span>
            )}

            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                lineHeight: "1.4",
                marginBottom: "12px",
              }}
            >
              {product.title}
            </h3>

            {/* Price Row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "var(--color-navy)",
                }}
              >
                {priceFormatted}
              </span>

              {listPriceFormatted && (
                <span
                  style={{
                    fontSize: "0.88rem",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
              {product.rating !== null ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: "var(--color-green-light)",
                    color: "var(--color-green)",
                    border: "1px solid var(--color-green-border)",
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                  }}
                >
                  <Star size={12} fill="currentColor" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  Unrated
                </span>
              )}

              {product.review_count !== null && (
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                  {product.review_count.toLocaleString("en-IN")} customer ratings
                </span>
              )}
            </div>

            {/* Grounded Match Analysis */}
            {product.explanation && (
              <div
                style={{
                  backgroundColor: "var(--color-lavender)",
                  border: "1px solid var(--color-lavender-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <Info size={14} color="var(--color-purple)" />
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-purple)" }}>
                    Grounded Match Analysis
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--color-navy)", lineHeight: "1.5", marginBottom: "10px" }}>
                  {product.explanation.summary}
                </p>

                {product.explanation.pros.length > 0 && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-green)", textTransform: "uppercase" }}>
                      Key Strengths
                    </span>
                    <ul style={{ paddingLeft: "16px", marginTop: "4px", fontSize: "0.8rem", color: "var(--color-text-primary)", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {product.explanation.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.explanation.cons.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-orange)", textTransform: "uppercase" }}>
                      Trade-offs
                    </span>
                    <ul style={{ paddingLeft: "16px", marginTop: "4px", fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {product.explanation.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Verified Matched Requirements */}
            {product.matched_features && product.matched_features.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
                  Verified Features
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {product.matched_features.map((feat, i) => (
                    <span key={i} className="badge-clean badge-green" style={{ fontSize: "0.72rem" }}>
                      <CheckCircle2 size={11} />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unverified Requirements */}
            {product.unverified_features && product.unverified_features.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--color-orange)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
                  Unverified In Listing
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {product.unverified_features.map((feat, i) => (
                    <span key={i} className="badge-clean badge-orange" style={{ fontSize: "0.72rem" }}>
                      <AlertTriangle size={11} />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Bullet Points */}
            {product.bullet_points && product.bullet_points.length > 0 && (
              <div>
                <h5 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "8px" }}>
                  Product Features & Specifications
                </h5>
                <ul
                  style={{
                    paddingLeft: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "0.8rem",
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
