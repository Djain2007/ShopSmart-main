import React, { useEffect, useState } from "react";
import { X, Heart, Trash2, ExternalLink, ShoppingCart, Scale } from "lucide-react";
import type { SavedProduct, UnifiedProduct, SourceName } from "../types";
import { apiClient } from "../api/client";

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRemoved?: () => void;
  onAddCompare?: (product: UnifiedProduct) => void;
}

export const SavedDrawer: React.FC<SavedDrawerProps> = ({
  isOpen,
  onClose,
  onProductRemoved,
  onAddCompare,
}) => {
  const [saved, setSaved] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const items = await apiClient.getSaved();
      setSaved(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSaved();
    }
  }, [isOpen]);

  const handleRemove = async (productId: string) => {
    await apiClient.removeSaved(productId);
    setSaved((prev) => prev.filter((p) => p.product_id !== productId));
    if (onProductRemoved) {
      onProductRemoved();
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
          width: "440px",
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
            <Heart size={20} fill="var(--color-rose)" color="var(--color-rose)" />
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)" }}>
              Wishlist ({saved.length})
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

        {/* Saved List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "40px 0" }}>
              Loading saved wishlist items...
            </p>
          ) : saved.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
              <ShoppingCart size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)" }}>Your wishlist is empty</p>
              <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                Click the heart icon on any product in Explore to save it here.
              </p>
            </div>
          ) : (
            saved.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    flexShrink: 0,
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <ShoppingCart size={18} color="var(--color-text-muted)" />
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className={`badge-clean ${item.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
                    style={{ fontSize: "0.68rem", marginBottom: "4px" }}
                  >
                    {item.source === "amazon.in" ? "Amazon.in" : "Flipkart"}
                  </span>

                  <h5
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: "600",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </h5>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.92rem", fontWeight: "800", color: "var(--color-navy)" }}>
                      {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "Price unlisted"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {onAddCompare && (
                        <button
                          type="button"
                          onClick={() => {
                            const src: SourceName =
                              item.source === "flipkart.com" ? "flipkart.com" : "amazon.in";
                            onAddCompare({
                              id: item.product_id,
                              title: item.title,
                              brand: item.product_details?.brand || null,
                              price: item.price,
                              list_price: item.product_details?.list_price || null,
                              currency: "INR",
                              rating: item.rating,
                              review_count: item.product_details?.review_count || null,
                              image_url: item.image_url,
                              url: item.url,
                              source: src,
                              attributes: item.product_details?.attributes || {},
                              bullet_points: item.product_details?.bullet_points || [],
                              retrieved_at: item.saved_at || new Date().toISOString(),
                              matched_features: item.product_details?.matched_features || [],
                              unverified_features: item.product_details?.unverified_features || [],
                              flags: item.product_details?.flags || [],
                              is_saved: true,
                            });
                          }}
                          style={{
                            color: "var(--color-royal-blue)",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                          title="Add to comparison"
                        >
                          <Scale size={14} />
                        </button>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center" }}
                        title="View on store"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.product_id)}
                        style={{
                          color: "var(--color-rose)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Remove from saved"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
