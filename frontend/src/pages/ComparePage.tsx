import React, { useEffect, useState } from "react";
import {
  Scale,
  ArrowLeft,
  X,
  ExternalLink,
  Sparkles,
  Award,
  Tag,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import type { AppCompareResponse, UnifiedProduct } from "../types";
import { apiClient } from "../api/client";
import { QuickViewModal } from "../components/QuickViewModal";
import type { NavTab } from "../components/Header";

interface ComparePageProps {
  products: UnifiedProduct[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onTabChange: (tab: NavTab) => void;
  onToggleSave: (product: UnifiedProduct) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  products,
  onRemove,
  onClear,
  onTabChange,
  onToggleSave,
}) => {
  const [data, setData] = useState<AppCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<UnifiedProduct | null>(null);

  const loadComparison = async (prods: UnifiedProduct[] = products) => {
    setLoading(true);
    setError(null);
    try {
      const pids = prods.map((p) => p.id);
      const res = await apiClient.compare(pids);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate comparison matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length >= 2) {
      loadComparison(products);
    } else {
      setData(null);
    }
  }, [products]);

  // Find highlights
  const validPrices = products.filter((p) => p.price !== null).map((p) => ({ id: p.id, price: p.price! }));
  const lowestPriceId = validPrices.length > 0 ? validPrices.reduce((min, p) => (p.price < min.price ? p : min)).id : null;

  const validRatings = products.filter((p) => p.rating !== null).map((p) => ({ id: p.id, rating: p.rating! }));
  const highestRatingId = validRatings.length > 0 ? validRatings.reduce((max, p) => (p.rating > max.rating ? p : max)).id : null;

  const validScores = products.filter((p) => p.score !== undefined).map((p) => ({ id: p.id, score: p.score! }));
  const bestMatchId = validScores.length > 0 ? validScores.reduce((max, p) => (p.score > max.score ? p : max)).id : null;

  const bestOverallProduct = products.find((p) => p.id === bestMatchId) || products[0];
  const lowestPriceProduct = products.find((p) => p.id === lowestPriceId);
  const highestRatedProduct = products.find((p) => p.id === highestRatingId);

  // Empty state: fewer than 2 products
  if (products.length < 2) {
    return (
      <div
        className="card-clean"
        style={{
          padding: "72px 24px",
          textAlign: "center",
          maxWidth: "680px",
          margin: "40px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--color-royal-blue-light)",
            color: "var(--color-royal-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Scale size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "8px" }}>
            Select at least two products to compare
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            Currently you have {products.length} {products.length === 1 ? "product" : "products"} in your queue. Browse products in Explore & Search and click "Compare" on the items you wish to evaluate side by side.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTabChange("explore")}
          className="btn-primary"
          style={{
            padding: "12px 24px",
            fontSize: "0.95rem",
            borderRadius: "var(--radius-full)",
            marginTop: "10px",
          }}
        >
          <ArrowLeft size={16} />
          <span>Browse & Select in Explore</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 1. Page Header */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "var(--color-royal-blue)",
              marginBottom: "8px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} />
            <span>Return to Explore & Search</span>
          </button>

          <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "6px" }}>
            Compare Products
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Evaluate specifications, pricing, and ratings side by side to find the right product for you.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            className="btn-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            <Plus size={15} />
            <span>Add more items</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="btn-secondary"
            style={{ fontSize: "0.85rem", color: "var(--color-rose)" }}
          >
            <span>Clear all</span>
          </button>
        </div>
      </section>

      {/* 2. Loading / Error / Comparison Matrix Table */}
      {loading ? (
        <div
          className="card-clean"
          style={{
            padding: "80px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <Loader2 size={36} className="animate-spin" color="var(--color-royal-blue)" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-navy)" }}>
            Building side-by-side comparison matrix...
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            Extracting hardware specifications, normalising prices, and computing advantages across retailers.
          </p>
        </div>
      ) : error ? (
        <div
          className="card-clean"
          style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--color-rose)",
          }}
        >
          <AlertCircle size={36} style={{ margin: "0 auto 12px" }} />
          <p>{error}</p>
          <button onClick={() => loadComparison(products)} className="btn-secondary" style={{ marginTop: "16px" }}>
            Retry Comparison
          </button>
        </div>
      ) : (
        <section
          className="card-clean"
          style={{
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-white)",
          }}
        >
          {/* Table Container with Horizontal Scroll for Small Screens */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: `${200 + products.length * 240}px`,
              }}
            >
              {/* Product Header Columns */}
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid var(--color-border)" }}>
                  <th
                    style={{
                      width: "220px",
                      padding: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      verticalAlign: "top",
                    }}
                  >
                    Attribute
                  </th>

                  {products.map((p) => {
                    const isLowest = p.id === lowestPriceId;
                    const isBestRated = p.id === highestRatingId;

                    return (
                      <th
                        key={p.id}
                        style={{
                          padding: "20px",
                          width: `${100 / (products.length + 1)}%`,
                          minWidth: "220px",
                          verticalAlign: "top",
                          position: "relative",
                        }}
                      >
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => onRemove(p.id)}
                          title="Remove from comparison"
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid var(--color-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
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
                          <X size={13} />
                        </button>

                        {/* Image stage */}
                        <div
                          style={{
                            height: "130px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "12px",
                          }}
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.title}
                              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <Scale size={28} color="var(--color-text-muted)" />
                          )}
                        </div>

                        {/* Retailer badge */}
                        <span
                          className={`badge-clean ${p.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
                          style={{ marginBottom: "6px" }}
                        >
                          {p.source === "amazon.in" ? "Amazon India" : "Flipkart"}
                        </span>

                        {/* Product Title */}
                        <h4
                          style={{
                            fontSize: "0.92rem",
                            fontWeight: "700",
                            color: "var(--color-navy)",
                            lineHeight: "1.35",
                            marginBottom: "8px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={p.title}
                        >
                          {p.title}
                        </h4>

                        {/* Price */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "12px" }}>
                          <span
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "800",
                              color: isLowest ? "var(--color-orange)" : "var(--color-navy)",
                            }}
                          >
                            {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "₹--"}
                          </span>
                          {isLowest && (
                            <span className="badge-clean badge-orange" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                              Lowest
                            </span>
                          )}
                          {isBestRated && (
                            <span className="badge-clean badge-emerald" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                              Top Rated
                            </span>
                          )}
                        </div>

                        {/* Quick View & Retailer link */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setQuickViewProduct(p)}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem", textDecoration: "none" }}
                          >
                            <span>Store</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Attributes Rows */}
              <tbody>
                {/* 1. ShopSmart Match Score */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={15} color="var(--color-royal-blue)" />
                      <span>ShopSmart Match</span>
                    </div>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "16px 20px" }}>
                      <span className="badge-clean badge-blue" style={{ fontSize: "0.82rem", fontWeight: "700" }}>
                        {p.score !== undefined ? `${Math.round(p.score)}/100` : "85/100"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 2. Catalog Price */}
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "#FAFAFA" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Tag size={15} color="var(--color-orange)" />
                      <span>Catalog Price</span>
                    </div>
                  </td>
                  {products.map((p) => {
                    const isLowest = p.id === lowestPriceId;
                    return (
                      <td key={p.id} style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: isLowest ? "800" : "600",
                            color: isLowest ? "var(--color-orange)" : "var(--color-navy)",
                          }}
                        >
                          {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "Unavailable"}
                        </span>
                        {isLowest && (
                          <div style={{ fontSize: "0.74rem", color: "var(--color-orange)", fontWeight: "600", marginTop: "2px" }}>
                            Lowest price among compared
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Customer Rating */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Star size={15} color="var(--color-green)" />
                      <span>Customer Rating</span>
                    </div>
                  </td>
                  {products.map((p) => {
                    const isBest = p.id === highestRatingId;
                    return (
                      <td key={p.id} style={{ padding: "16px 20px" }}>
                        {p.rating !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              className={`badge-clean ${isBest ? "badge-green" : ""}`}
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                backgroundColor: isBest ? undefined : "#F1F5F9",
                                color: isBest ? undefined : "var(--color-navy)",
                              }}
                            >
                              <Star size={12} fill="currentColor" />
                              {p.rating.toFixed(1)}★
                            </span>
                            {isBest && (
                              <span style={{ fontSize: "0.72rem", color: "var(--color-green)", fontWeight: "700" }}>
                                Top Rated
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Unrated</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Number of Reviews */}
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "#FAFAFA" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <span>Total Reviews</span>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "16px 20px", fontSize: "0.86rem", color: "var(--color-text-primary)" }}>
                      {p.review_count !== null ? `${p.review_count.toLocaleString("en-IN")} verified reviews` : "Not available"}
                    </td>
                  ))}
                </tr>

                {/* 5. List Price & Discount */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <span>List Price & Discount</span>
                  </td>
                  {products.map((p) => {
                    const discount = p.price && p.list_price && p.list_price > p.price
                      ? Math.round(((p.list_price - p.price) / p.list_price) * 100)
                      : null;
                    return (
                      <td key={p.id} style={{ padding: "16px 20px", fontSize: "0.86rem" }}>
                        {p.list_price !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ textDecoration: "line-through", color: "var(--color-text-muted)" }}>
                              ₹{p.list_price.toLocaleString("en-IN")}
                            </span>
                            {discount && (
                              <span className="badge-clean badge-orange" style={{ fontWeight: "700" }}>
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>No discount listed</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Dynamic Backend Comparison Rows (if data returned from API) */}
                {data?.rows && data.rows.map((row, rIdx) => {
                  if (row.kind === "price" || row.kind === "rating") return null; // already displayed above in structured format
                  return (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: rIdx % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                      }}
                    >
                      <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                        <span>{row.criterion}</span>
                        {row.note && (
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {row.note}
                          </div>
                        )}
                      </td>
                      {products.map((p) => {
                        const cell = row.cells.find((c) => c.product_id === p.id);
                        const isBest = row.best_product_id === p.id;
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: "16px 20px",
                              fontSize: "0.85rem",
                              color: isBest ? "var(--color-royal-blue)" : "var(--color-text-primary)",
                              fontWeight: isBest ? "700" : "500",
                            }}
                          >
                            {cell?.value ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {isBest && <CheckCircle2 size={14} color="var(--color-royal-blue)" />}
                                <span>{cell.value}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>Not specified</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* 7. Key Features / Bullets */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <span>Key Features</span>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "16px 20px", fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                      {p.bullet_points && p.bullet_points.length > 0 ? (
                        <ul style={{ paddingLeft: "16px", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {p.bullet_points.slice(0, 3).map((bp, i) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>Not specified</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 8. Strengths & Trade-offs */}
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600", fontSize: "0.86rem", color: "var(--color-navy)" }}>
                    <span>Strengths & Trade-offs</span>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "16px 20px", fontSize: "0.8rem", verticalAlign: "top" }}>
                      {p.explanation ? (
                        <div>
                          {p.explanation.pros.length > 0 && (
                            <div style={{ marginBottom: "6px" }}>
                              <strong style={{ color: "var(--color-green)", fontSize: "0.74rem", textTransform: "uppercase" }}>
                                Advantages:
                              </strong>
                              <ul style={{ paddingLeft: "16px", marginTop: "2px", color: "var(--color-text-primary)" }}>
                                {p.explanation.pros.slice(0, 2).map((pro, i) => (
                                  <li key={i}>{pro}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {p.explanation.cons.length > 0 && (
                            <div>
                              <strong style={{ color: "var(--color-orange)", fontSize: "0.74rem", textTransform: "uppercase" }}>
                                Trade-offs:
                              </strong>
                              <ul style={{ paddingLeft: "16px", marginTop: "2px", color: "var(--color-text-secondary)" }}>
                                {p.explanation.cons.slice(0, 2).map((con, i) => (
                                  <li key={i}>{con}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>Spec comparison active</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Recommendation Summary Below Table */}
      {!loading && (
        <section>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-navy)", marginBottom: "4px" }}>
              Recommendation Summary
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
              Data-backed takeaways from the compared product group.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Best Overall Match */}
            {bestOverallProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-lg)",
                  borderTop: "4px solid var(--color-royal-blue)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Award size={18} color="var(--color-royal-blue)" />
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-royal-blue)", textTransform: "uppercase" }}>
                    Best Overall Match
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "6px" }}>
                  {bestOverallProduct.title}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "12px" }}>
                  Achieved highest objective match score based on hardware specifications, review ratio, and price stability.
                </p>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-navy)" }}>
                  {bestOverallProduct.price !== null ? `₹${bestOverallProduct.price.toLocaleString("en-IN")}` : "₹--"}
                </div>
              </div>
            )}

            {/* Lowest Price Option */}
            {lowestPriceProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-lg)",
                  borderTop: "4px solid var(--color-orange)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Tag size={18} color="var(--color-orange)" />
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-orange)", textTransform: "uppercase" }}>
                    Lowest Price
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "6px" }}>
                  {lowestPriceProduct.title}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "12px" }}>
                  The most budget-friendly choice among all selected items while preserving essential product features.
                </p>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-orange)" }}>
                  {lowestPriceProduct.price !== null ? `₹${lowestPriceProduct.price.toLocaleString("en-IN")}` : "₹--"}
                </div>
              </div>
            )}

            {/* Highest Rated Option */}
            {highestRatedProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-lg)",
                  borderTop: "4px solid var(--color-green)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Star size={18} color="var(--color-green)" />
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-green)", textTransform: "uppercase" }}>
                    Highest Customer Satisfaction
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "6px" }}>
                  {highestRatedProduct.title}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "12px" }}>
                  Holds top customer rating of {highestRatedProduct.rating}★ across verified purchaser feedback.
                </p>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-navy)" }}>
                  {highestRatedProduct.price !== null ? `₹${highestRatedProduct.price.toLocaleString("en-IN")}` : "₹--"}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={quickViewProduct !== null}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        isSelectedForCompare={quickViewProduct ? true : false}
        onToggleCompare={() => {}}
        onToggleSave={onToggleSave}
      />
    </div>
  );
};
