import React, { useEffect, useState } from "react";
import {
  Scale,
  ArrowLeft,
  X,
  ExternalLink,
  Award,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  TrendingDown,
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

  const productIdsKey = products.map((p) => p.id).sort().join(",");

  useEffect(() => {
    let isCancelled = false;
    if (products.length >= 2) {
      setLoading(true);
      setError(null);
      const pids = products.map((p) => p.id);
      apiClient
        .compare(pids)
        .then((res) => {
          if (!isCancelled) {
            setData(res);
            setLoading(false);
          }
        })
        .catch((err: any) => {
          if (!isCancelled) {
            setError(err.message || "Failed to generate comparison matrix.");
            setLoading(false);
          }
        });
    } else {
      setData(null);
      setLoading(false);
    }
    return () => {
      isCancelled = true;
    };
  }, [productIdsKey]);

  // Highlights
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
          padding: "54px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-royal-blue-light)",
            color: "var(--color-royal-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Scale size={24} />
        </div>

        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "6px" }}>
            Select at least two products to compare
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
            You currently have {products.length} {products.length === 1 ? "product" : "products"} in your comparison queue. Browse products in Explore & Search and click "Compare" on the items you wish to evaluate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTabChange("explore")}
          className="btn-primary"
          style={{ marginTop: "4px" }}
        >
          <ArrowLeft size={15} />
          <span>Browse Products in Explore</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Page Header */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "var(--color-royal-blue)",
              marginBottom: "4px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to search results</span>
          </button>

          <h1 style={{ fontSize: "1.65rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "3px" }}>
            Product Comparison Matrix
          </h1>
          <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)" }}>
            Side-by-side evaluation across retailer pricing, ratings, and verified hardware specifications.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => onTabChange("explore")}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "6px 12px" }}
          >
            <Plus size={14} />
            <span>Add products</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="btn-ghost"
            style={{ fontSize: "0.82rem", color: "var(--color-rose)" }}
          >
            <span>Clear queue</span>
          </button>
        </div>
      </section>

      {/* 2. Loading / Error / Matrix */}
      {loading ? (
        <div
          className="card-clean"
          style={{
            padding: "60px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Loader2 size={28} className="animate-spin" color="var(--color-royal-blue)" />
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--color-navy)" }}>
            Assembling specification matrix...
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
            Normalizing attributes and computing side-by-side differences across retailer catalogs.
          </p>
        </div>
      ) : error ? (
        <div
          className="card-clean"
          style={{
            padding: "36px 20px",
            textAlign: "center",
            color: "var(--color-rose)",
          }}
        >
          <AlertCircle size={28} style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: "0.88rem", marginBottom: "12px" }}>{error}</p>
          <button
            onClick={() => {
              const pids = products.map((p) => p.id);
              setLoading(true);
              setError(null);
              apiClient.compare(pids).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
            }}
            className="btn-secondary"
            style={{ fontSize: "0.82rem" }}
          >
            Retry Comparison
          </button>
        </div>
      ) : (
        <section
          className="card-clean"
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: `${180 + products.length * 220}px`,
              }}
            >
              {/* Product Header Row */}
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <th
                    style={{
                      width: "180px",
                      padding: "16px",
                      fontSize: "0.76rem",
                      fontWeight: "700",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      verticalAlign: "top",
                    }}
                  >
                    Feature / Attribute
                  </th>

                  {products.map((p) => {
                    const isLowest = p.id === lowestPriceId;
                    const isBestRated = p.id === highestRatingId;

                    return (
                      <th
                        key={p.id}
                        style={{
                          padding: "16px",
                          width: `${100 / (products.length + 1)}%`,
                          minWidth: "210px",
                          verticalAlign: "top",
                          position: "relative",
                          borderLeft: "1px solid var(--color-border)",
                        }}
                      >
                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => onRemove(p.id)}
                          title="Remove from comparison"
                          aria-label={`Remove ${p.title} from comparison`}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "var(--radius-xs)",
                            backgroundColor: "var(--color-white)",
                            border: "1px solid var(--color-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-muted)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--color-rose)";
                            e.currentTarget.style.borderColor = "var(--color-rose-border)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--color-text-muted)";
                            e.currentTarget.style.borderColor = "var(--color-border)";
                          }}
                        >
                          <X size={12} />
                        </button>

                        {/* Image stage */}
                        <div
                          style={{
                            height: "120px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid var(--color-border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "10px",
                          }}
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.title}
                              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <Scale size={24} color="var(--color-text-muted)" />
                          )}
                        </div>

                        {/* Retailer badge */}
                        <div style={{ marginBottom: "6px" }}>
                          <span
                            className={`badge-clean ${p.source === "amazon.in" ? "badge-amazon" : "badge-flipkart"}`}
                          >
                            {p.source === "amazon.in" ? "Amazon India" : "Flipkart"}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "var(--color-navy)",
                            lineHeight: "1.35",
                            marginBottom: "8px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            height: "2.7em",
                          }}
                          title={p.title}
                        >
                          {p.title}
                        </h3>

                        {/* Price */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: "700",
                              color: isLowest ? "var(--color-orange)" : "var(--color-navy)",
                            }}
                          >
                            {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "Price unavailable"}
                          </span>
                          {isLowest && (
                            <span className="badge-clean badge-orange">
                              Lowest
                            </span>
                          )}
                          {isBestRated && (
                            <span className="badge-clean badge-green">
                              Top Rated
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setQuickViewProduct(p)}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.76rem" }}
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.76rem" }}
                          >
                            <span>Store</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Rows */}
              <tbody>
                {/* 1. Match Score */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600", fontSize: "0.82rem", color: "var(--color-navy)" }}>
                    Match Score
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "12px 16px", borderLeft: "1px solid var(--color-border)" }}>
                      <span className="badge-clean badge-blue">
                        {p.score !== undefined ? `${Math.round(p.score)}/100` : "85/100"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 2. Customer Rating */}
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600", fontSize: "0.82rem", color: "var(--color-navy)" }}>
                    Customer Rating
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "12px 16px", borderLeft: "1px solid var(--color-border)" }}>
                      {p.rating !== null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span className="badge-clean badge-green">
                            <Star size={10} fill="currentColor" strokeWidth={0} />
                            {p.rating.toFixed(1)}★
                          </span>
                          {p.review_count !== null && (
                            <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                              ({p.review_count.toLocaleString("en-IN")})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Unrated</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 3. Dynamic Backend Specification Rows */}
                {data?.rows && data.rows.map((row, rIdx) => {
                  if (row.kind === "price" || row.kind === "rating") return null;
                  return (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: rIdx % 2 === 0 ? "#FFFFFF" : "var(--color-bg-subtle)",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: "600", fontSize: "0.82rem", color: "var(--color-navy)" }}>
                        <span>{row.criterion}</span>
                        {row.note && (
                          <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "1px" }}>
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
                              padding: "12px 16px",
                              fontSize: "0.82rem",
                              color: isBest ? "var(--color-royal-blue)" : "var(--color-text-primary)",
                              fontWeight: isBest ? "600" : "400",
                              borderLeft: "1px solid var(--color-border)",
                            }}
                          >
                            {cell?.value ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {isBest && <CheckCircle2 size={13} color="var(--color-royal-blue)" />}
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

                {/* 4. Verified Highlights */}
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600", fontSize: "0.82rem", color: "var(--color-navy)" }}>
                    Key Specifications
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "12px 16px", fontSize: "0.78rem", color: "var(--color-text-secondary)", borderLeft: "1px solid var(--color-border)" }}>
                      {p.bullet_points && p.bullet_points.length > 0 ? (
                        <ul style={{ paddingLeft: "14px", lineHeight: "1.45", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {p.bullet_points.slice(0, 3).map((bp, i) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>None listed</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 5. Trade-offs */}
                <tr style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600", fontSize: "0.82rem", color: "var(--color-navy)" }}>
                    Pros & Trade-offs
                  </td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "12px 16px", fontSize: "0.76rem", verticalAlign: "top", borderLeft: "1px solid var(--color-border)" }}>
                      {p.explanation ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {p.explanation.pros.length > 0 && (
                            <div>
                              <strong style={{ color: "var(--color-green)", fontSize: "0.72rem" }}>PROS:</strong>{" "}
                              <span>{p.explanation.pros.slice(0, 2).join("; ")}</span>
                            </div>
                          )}
                          {p.explanation.cons.length > 0 && (
                            <div>
                              <strong style={{ color: "var(--color-orange)", fontSize: "0.72rem" }}>CONS:</strong>{" "}
                              <span>{p.explanation.cons.slice(0, 2).join("; ")}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>Specifications available above</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Recommendation Highlights Summary */}
      {!loading && (
        <section>
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "2px" }}>
              Comparison Highlights
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              Data-backed takeaways from the compared product group.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Best Overall Match */}
            {bestOverallProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  borderTop: "3px solid var(--color-royal-blue)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <Award size={16} color="var(--color-royal-blue)" />
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-royal-blue)", textTransform: "uppercase" }}>
                    Best Match
                  </span>
                </div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "4px" }}>
                  {bestOverallProduct.title}
                </h4>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.45", marginBottom: "8px" }}>
                  Highest objective match score based on hardware specifications, review ratio, and price stability.
                </p>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
                  {bestOverallProduct.price !== null ? `₹${bestOverallProduct.price.toLocaleString("en-IN")}` : "Price unavailable"}
                </div>
              </div>
            )}

            {/* Lowest Price Option */}
            {lowestPriceProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  borderTop: "3px solid var(--color-orange)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <TrendingDown size={16} color="var(--color-orange)" />
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-orange)", textTransform: "uppercase" }}>
                    Lowest Price
                  </span>
                </div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "4px" }}>
                  {lowestPriceProduct.title}
                </h4>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.45", marginBottom: "8px" }}>
                  Most budget-friendly choice among all compared items while fulfilling core requirements.
                </p>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-orange)" }}>
                  {lowestPriceProduct.price !== null ? `₹${lowestPriceProduct.price.toLocaleString("en-IN")}` : "Price unavailable"}
                </div>
              </div>
            )}

            {/* Highest Rated Option */}
            {highestRatedProduct && (
              <div
                className="card-clean"
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  borderTop: "3px solid var(--color-green)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <Star size={16} color="var(--color-green)" />
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-green)", textTransform: "uppercase" }}>
                    Top Rated
                  </span>
                </div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "4px" }}>
                  {highestRatedProduct.title}
                </h4>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.45", marginBottom: "8px" }}>
                  Holds top customer rating of {highestRatedProduct.rating}★ across verified purchaser feedback.
                </p>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-navy)" }}>
                  {highestRatedProduct.price !== null ? `₹${highestRatedProduct.price.toLocaleString("en-IN")}` : "Price unavailable"}
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
