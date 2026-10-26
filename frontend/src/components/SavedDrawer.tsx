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

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchSavedItems = async () => {
      setLoading(true);
      try {
        const items = await apiClient.getSaved();
        if (!cancelled) {
          setSaved(items);
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSavedItems();

    return () => {
      cancelled = true;
    };
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
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1150,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.18s ease-out",
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
          padding: "20px 24px",
          overflow: "hidden",
          animation: "popIn 0.2s ease-out",
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
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-rose-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-rose)",
              }}
            >
              <Heart size={16} fill="currentColor" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
                Saved Wishlist
              </h3>
              <span style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
                {saved.length} {saved.length === 1 ? "product" : "products"} saved
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Wishlist"
            style={{
              width: "30px",
              height: "30px",
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

        {/* Saved List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "0.85rem" }}>Loading saved wishlist items...</p>
            </div>
          ) : saved.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 16px", color: "var(--color-text-muted)" }}>
              <ShoppingCart size={36} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
              <p style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)" }}>Your wishlist is empty</p>
              <p style={{ fontSize: "0.8rem", marginTop: "4px", color: "var(--color-text-secondary)", maxWidth: "260px", margin: "4px auto 0" }}>
                Click the bookmark/heart icon on any product in search results to save it here.
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
                  transition: "all var(--transition-fast)",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span
                      className={`badge-clean ${item.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
                      style={{ fontSize: "0.66rem", padding: "1px 6px" }}
                    >
                      {item.source === "amazon.in" ? "Amazon.in" : "Flipkart"}
                    </span>
                  </div>

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
                    title={item.title}
                  >
                    {item.title}
                  </h5>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--color-navy)" }}>
                      {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "Price unlisted"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                            padding: "4px 8px",
                            borderRadius: "var(--radius-xs)",
                            color: "var(--color-royal-blue)",
                            backgroundColor: "var(--color-royal-blue-light)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                          title="Add to comparison"
                        >
                          <Scale size={12} />
                          <span>Compare</span>
                        </button>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "4px 6px",
                          borderRadius: "var(--radius-xs)",
                          color: "var(--color-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                        title="View on store"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.product_id)}
                        style={{
                          padding: "4px 6px",
                          borderRadius: "var(--radius-xs)",
                          color: "var(--color-text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          transition: "color var(--transition-fast)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-rose)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
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

