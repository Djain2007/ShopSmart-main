import React, { useState } from "react";
import { Scale, X, ArrowRight, ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { UnifiedProduct } from "../types";

interface ComparisonDrawerProps {
  selectedProducts: UnifiedProduct[];
  maxSlots?: number;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onOpenCompare: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  selectedProducts,
  maxSlots = 4,
  onRemove,
  onClear,
  onOpenCompare,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (selectedProducts.length === 0) return null;

  const count = selectedProducts.length;
  const canCompare = count >= 2;
  const emptySlotsCount = Math.max(0, maxSlots - count);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 950,
        width: "auto",
        maxWidth: "94vw",
        animation: "popIn 0.22s ease-out",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "18px",
          padding: "10px 18px",
          backgroundColor: isMinimized ? "var(--color-white)" : "#F8FAFC",
          borderBottom: isMinimized ? "none" : "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              backgroundColor: "var(--color-royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Scale size={15} />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Comparison Queue ({count}/{maxSlots})
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: canCompare ? "var(--color-green)" : "var(--color-text-muted)",
                marginLeft: "8px",
              }}
            >
              {canCompare ? "Ready to compare" : "Select 1 more item"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isMinimized && (
            <button
              type="button"
              onClick={onClear}
              style={{
                fontSize: "0.76rem",
                color: "var(--color-text-secondary)",
                padding: "3px 8px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-rose)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              Clear all
            </button>
          )}

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-bg-muted)",
              cursor: "pointer",
            }}
            title={isMinimized ? "Expand Queue" : "Minimize Queue"}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main Queue Content */}
      {!isMinimized && (
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          {/* Selected Product Slots */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflowX: "auto" }}>
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  position: "relative",
                  width: "160px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "var(--radius-sm)",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <Scale size={16} color="var(--color-text-muted)" />
                  )}
                </div>

                <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={product.title}
                  >
                    {product.title}
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-royal-blue)" }}>
                    {product.price !== null ? `₹${product.price.toLocaleString("en-IN")}` : "₹--"}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemove(product.id)}
                  title="Remove from compare"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-rose)";
                    e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "110px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--color-border)",
                  backgroundColor: "#FAFAFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              >
                <Plus size={13} />
                <span>Add item</span>
              </div>
            ))}
          </div>

          {/* Compare Button */}
          <button
            type="button"
            onClick={onOpenCompare}
            disabled={!canCompare}
            className="btn-primary"
            style={{
              padding: "9px 18px",
              fontSize: "0.85rem",
              borderRadius: "var(--radius-full)",
              flexShrink: 0,
            }}
          >
            <span>Compare {count} items</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
