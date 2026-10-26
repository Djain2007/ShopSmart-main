import React, { useState } from "react";
import { Star, Heart, Check, Scale, Eye, ExternalLink, Package } from "lucide-react";
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

  const priceFormatted = product.price !== null && product.price > 0
    ? `₹${product.price.toLocaleString("en-IN")}`
    : "Price Unavailable";

  const listPriceFormatted = product.list_price !== null && product.list_price > (product.price ?? 0)
    ? `₹${product.list_price.toLocaleString("en-IN")}`
    : null;

  const discountPercent = product.price && product.list_price && product.list_price > product.price
    ? Math.round(((product.list_price - product.price) / product.list_price) * 100)
    : null;

  const hasScore = product.score !== undefined && product.score !== null;

  return (
    <article
      className="card-clean"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: "var(--radius-md)",
        border: isSelectedForCompare
          ? "1px solid var(--color-royal-blue)"
          : "1px solid var(--color-border)",
        boxShadow: isSelectedForCompare
          ? "0 0 0 2px rgba(37, 99, 235, 0.15), var(--shadow-xs)"
          : "var(--shadow-xs)",
        backgroundColor: "var(--color-white)",
        padding: "14px",
        transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelectedForCompare) {
          e.currentTarget.style.borderColor = "var(--color-border-hover)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelectedForCompare) {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.boxShadow = "var(--shadow-xs)";
        }
      }}
    >
      {/* Top Meta Header: Retailer Tag, Score & Wishlist Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            className={`badge-clean ${product.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
          >
            {product.source === "amazon.in" ? "Amazon India" : "Flipkart"}
          </span>

          {hasScore && (
            <span
              className="badge-clean badge-blue"
              title="Verified specification and relevance match score"
            >
              {Math.round(product.score!)}/100
            </span>
          )}
        </div>

        {/* Wishlist Action */}
        <button
          type="button"
          onClick={() => onToggleSave(product)}
          aria-label={product.is_saved ? "Remove from saved items" : "Save item for later"}
          title={product.is_saved ? "Remove from saved items" : "Save item"}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "transparent",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: product.is_saved ? "var(--color-rose)" : "var(--color-text-muted)",
            transition: "all var(--transition-fast)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-rose-light)";
            e.currentTarget.style.borderColor = "var(--color-rose-border)";
            e.currentTarget.style.color = "var(--color-rose)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = product.is_saved ? "var(--color-rose)" : "var(--color-text-muted)";
          }}
        >
          <Heart size={14} fill={product.is_saved ? "var(--color-rose)" : "none"} strokeWidth={2} />
        </button>
      </div>

      {/* Product Image Stage */}
      <div
        style={{
          height: "170px",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          marginBottom: "12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border-subtle)",
          overflow: "hidden",
        }}
      >
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
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
              gap: "4px",
              color: "var(--color-text-muted)",
            }}
          >
            <Package size={28} strokeWidth={1.5} />
            <span style={{ fontSize: "0.72rem" }}>Listing image unavailable</span>
          </div>
        )}
      </div>

      {/* Brand & Product Title */}
      <div style={{ marginBottom: "6px" }}>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: "700",
            color: "var(--color-royal-blue)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            display: "block",
            marginBottom: "3px",
          }}
        >
          {product.brand || "VERIFIED LISTING"}
        </span>

        <h4
          style={{
            fontSize: "0.88rem",
            fontWeight: "600",
            lineHeight: "1.38",
            color: "var(--color-navy)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "2.76em",
          }}
          title={product.title}
        >
          {product.title}
        </h4>
      </div>

      {/* Rating & Review Count */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        {product.rating !== null ? (
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                backgroundColor: "var(--color-green-light)",
                color: "var(--color-green)",
                border: "1px solid var(--color-green-border)",
                padding: "1px 5px",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.72rem",
                fontWeight: "700",
              }}
            >
              <Star size={10} fill="currentColor" strokeWidth={0} />
              <span>{product.rating.toFixed(1)}</span>
            </div>

            {product.review_count !== null && (
              <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                ({product.review_count.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
            Rating not available
          </span>
        )}
      </div>

      {/* Pricing Row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "1.15rem",
            fontWeight: "700",
            color: "var(--color-navy)",
            letterSpacing: "-0.02em",
          }}
        >
          {priceFormatted}
        </span>

        {listPriceFormatted && (
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              textDecoration: "line-through",
            }}
          >
            {listPriceFormatted}
          </span>
        )}

        {discountPercent && discountPercent > 0 && (
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              color: "var(--color-green)",
              backgroundColor: "var(--color-green-light)",
              padding: "1px 5px",
              borderRadius: "var(--radius-xs)",
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
            fontSize: "0.74rem",
            color: "var(--color-text-secondary)",
            lineHeight: "1.45",
            marginBottom: "12px",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "1.45em",
          }}
          title={product.bullet_points[0]}
        >
          • {product.bullet_points[0]}
        </p>
      )}

      {/* Action Controls */}
      <div
        style={{
          marginTop: "auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          paddingTop: "6px",
        }}
      >
        {/* Compare Action */}
        <button
          type="button"
          onClick={() => onToggleCompare(product)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 8px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.78rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            backgroundColor: isSelectedForCompare ? "var(--color-royal-blue)" : "var(--color-bg-subtle)",
            color: isSelectedForCompare ? "#FFFFFF" : "var(--color-navy)",
            border: isSelectedForCompare ? "1px solid var(--color-royal-blue)" : "1px solid var(--color-border)",
          }}
          onMouseEnter={(e) => {
            if (!isSelectedForCompare) {
              e.currentTarget.style.backgroundColor = "var(--color-royal-blue-light)";
              e.currentTarget.style.color = "var(--color-royal-blue)";
              e.currentTarget.style.borderColor = "var(--color-royal-blue-border)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelectedForCompare) {
              e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
              e.currentTarget.style.color = "var(--color-navy)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }
          }}
        >
          {isSelectedForCompare ? (
            <>
              <Check size={13} strokeWidth={2.5} />
              <span>Compared</span>
            </>
          ) : (
            <>
              <Scale size={13} />
              <span>Compare</span>
            </>
          )}
        </button>

        {/* Quick View Modal Trigger */}
        <button
          type="button"
          onClick={() => onQuickView && onQuickView(product)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 8px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.78rem",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: "var(--color-white)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
            e.currentTarget.style.borderColor = "var(--color-border-hover)";
            e.currentTarget.style.color = "var(--color-navy)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-white)";
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          <Eye size={13} />
          <span>Details</span>
        </button>
      </div>

      {/* External Direct Retailer Link */}
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          marginTop: "8px",
          paddingTop: "6px",
          borderTop: "1px solid var(--color-border-subtle)",
          fontSize: "0.74rem",
          fontWeight: "500",
          color: "var(--color-text-muted)",
          transition: "color var(--transition-fast)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-royal-blue)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        <span>Open on {product.source === "amazon.in" ? "Amazon.in" : "Flipkart"}</span>
        <ExternalLink size={11} />
      </a>
    </article>
  );
};
