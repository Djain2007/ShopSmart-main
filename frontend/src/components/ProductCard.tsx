import React, { useState } from "react";
import { Star, Heart, Check, Sparkles, Scale, Eye, ExternalLink } from "lucide-react";
import type { UnifiedProduct } from "../types";

interface ProductCardProps {
  product: UnifiedProduct;
  isSelectedForCompare: boolean;
  onToggleCompare: (product: UnifiedProduct) => void;
  onToggleSave: (product: UnifiedProduct) => void;
  onQuickView?: (product: UnifiedProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelectedForCompare,
  onToggleCompare,
  onToggleSave,
  onQuickView,
}) => {
  const [imgError, setImgError] = useState(false);

  const priceFormatted = product.price !== null
    ? `₹${product.price.toLocaleString("en-IN")}`
    : "Price Unavailable";

  const listPriceFormatted = product.list_price !== null
    ? `₹${product.list_price.toLocaleString("en-IN")}`
    : null;

  const discountPercent = product.price && product.list_price && product.list_price > product.price
    ? Math.round(((product.list_price - product.price) / product.list_price) * 100)
    : null;

  const matchPercent = product.score !== undefined
    ? Math.min(100, Math.max(0, Math.round(product.score)))
    : null;

  return (
    <div
      className="card-clean"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        position: "relative",
        border: isSelectedForCompare ? "2px solid var(--color-royal-blue)" : "1px solid var(--color-border)",
        boxShadow: isSelectedForCompare ? "0 4px 16px rgba(37, 99, 235, 0.18)" : "var(--shadow-sm)",
      }}
    >
      {/* Top Tag Row: Retailer & Wishlist */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <span
          className={`badge-clean ${product.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {product.source === "amazon.in" ? "Amazon.in" : "Flipkart"}
        </span>

        {/* Wishlist Heart Action */}
        <button
          type="button"
          onClick={() => onToggleSave(product)}
          title={product.is_saved ? "Remove from Wishlist" : "Save to Wishlist"}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-xs)",
            color: product.is_saved ? "var(--color-rose)" : "var(--color-text-muted)",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.borderColor = "var(--color-rose)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          <Heart size={16} fill={product.is_saved ? "var(--color-rose)" : "none"} />
        </button>
      </div>

      {/* Product Image Stage */}
      <div
        style={{
          height: "210px",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 16px 20px",
          position: "relative",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.title}
            onError={() => setImgError(true)}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              transition: "transform var(--transition-fast)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text-muted)",
            }}
          >
            <Eye size={36} strokeWidth={1.5} />
            <span style={{ fontSize: "0.75rem" }}>Product Photo</span>
          </div>
        )}

        {/* Match Percentage Badge */}
        {matchPercent !== null && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "12px",
              backgroundColor: "rgba(37, 99, 235, 0.95)",
              color: "#FFFFFF",
              borderRadius: "var(--radius-full)",
              padding: "3px 9px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.74rem",
              fontWeight: "700",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Sparkles size={11} fill="#FFFFFF" />
            <span>{matchPercent}% Match</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          backgroundColor: "var(--color-white)",
        }}
      >
        {/* Brand & Category Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              color: "var(--color-royal-blue)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {product.brand || "Verified Brand"}
          </span>
        </div>

        {/* Product Title */}
        <h4
          style={{
            fontSize: "0.92rem",
            fontWeight: "600",
            lineHeight: "1.4",
            color: "var(--color-navy)",
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "2.8em",
          }}
          title={product.title}
        >
          {product.title}
        </h4>

        {/* Rating and Review Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          {product.rating !== null ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                backgroundColor: "var(--color-green-light)",
                color: "var(--color-green)",
                border: "1px solid var(--color-green-border)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.74rem",
                fontWeight: "700",
              }}
            >
              <Star size={11} fill="currentColor" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          ) : (
            <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
              No rating
            </span>
          )}

          {product.review_count !== null && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              ({product.review_count.toLocaleString("en-IN")})
            </span>
          )}
        </div>

        {/* Pricing Row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: "800",
              color: "var(--color-navy)",
            }}
          >
            {priceFormatted}
          </span>

          {listPriceFormatted && (
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--color-text-muted)",
                textDecoration: "line-through",
              }}
            >
              {listPriceFormatted}
            </span>
          )}

          {discountPercent && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "var(--color-orange)",
              }}
            >
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Feature Evidence Snippet */}
        {product.bullet_points && product.bullet_points.length > 0 && (
          <p
            style={{
              fontSize: "0.76rem",
              color: "var(--color-text-secondary)",
              lineHeight: "1.45",
              marginBottom: "16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.bullet_points[0]}
          </p>
        )}

        {/* Actions Row */}
        <div
          style={{
            marginTop: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            paddingTop: "8px",
          }}
        >
          {/* Compare Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: isSelectedForCompare ? "var(--color-royal-blue)" : "#F8FAFC",
              color: isSelectedForCompare ? "#FFFFFF" : "var(--color-navy)",
              border: isSelectedForCompare ? "1px solid var(--color-royal-blue)" : "1px solid var(--color-border)",
            }}
            onMouseEnter={(e) => {
              if (!isSelectedForCompare) {
                e.currentTarget.style.backgroundColor = "var(--color-royal-blue-light)";
                e.currentTarget.style.color = "var(--color-royal-blue)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelectedForCompare) {
                e.currentTarget.style.backgroundColor = "#F8FAFC";
                e.currentTarget.style.color = "var(--color-navy)";
              }
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

          {/* Details / Quick View Button */}
          <button
            type="button"
            onClick={() => onQuickView && onQuickView(product)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              backgroundColor: "#FFFFFF",
              color: "var(--color-navy)",
              border: "1px solid var(--color-border)",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            <Eye size={14} />
            <span>Details</span>
          </button>
        </div>

        {/* View on Retailer direct link */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            marginTop: "8px",
            fontSize: "0.76rem",
            color: "var(--color-text-secondary)",
            transition: "color var(--transition-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
        >
          <span>View on {product.source === "amazon.in" ? "Amazon" : "Flipkart"}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
