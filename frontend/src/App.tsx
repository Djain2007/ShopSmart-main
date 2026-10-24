import { useState, useEffect, useRef } from "react";
import { Header, type NavTab } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { ComparePage } from "./pages/ComparePage";
import { ComparisonDrawer } from "./components/ComparisonDrawer";
import { ProfileModal } from "./components/ProfileModal";
import { SavedDrawer } from "./components/SavedDrawer";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { AIConfigModal } from "./components/AIConfigModal";
import { apiClient } from "./api/client";
import type { AppSearchResponse, SourceName, SystemStatus, UnifiedProduct } from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [searchResponse, setSearchResponse] = useState<AppSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Compare selection (up to 4-6 products)
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const loadStatus = async () => {
    try {
      const res = await apiClient.getStatus();
      setSystemStatus(res);
    } catch {
      // Offline fallback handling
    }
  };

  const loadSavedCount = async () => {
    try {
      const items = await apiClient.getSaved();
      setSavedCount(items.length);
    } catch {
      // Ignore
    }
  };

  const loadInitialRecommendations = async () => {
    try {
      // Fetch initial discovery products quietly
      const res = await apiClient.search({
        query: "wireless earbuds",
        sources: ["amazon.in", "flipkart.com"],
        maxResults: 8,
      });
      setSearchResponse(res);
    } catch {
      // Graceful fallback if backend is still starting
    }
  };

  const hasInitialized = useRef(false);
  const inFlightQueryRef = useRef<string | null>(null);

  // Load initial status and saved count on mount (single execution)
  useEffect(() => {
    loadStatus();
    loadSavedCount();
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadInitialRecommendations();
    }
  }, []);

  const handleSearch = async (query: string, sources?: SourceName[]) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Prevent duplicate submission if the same search is already in flight
    if (loading && inFlightQueryRef.current?.toLowerCase() === trimmed.toLowerCase()) {
      return;
    }

    inFlightQueryRef.current = trimmed;
    setLoading(true);
    setSearchError(null);

    try {
      const res = await apiClient.search({
        query: trimmed,
        sources: sources || ["amazon.in", "flipkart.com"],
        maxResults: 12,
      });
      setSearchResponse(res);
      loadStatus();
      loadSavedCount();
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setSearchError(err.message || "Search failed. Please verify that the local backend is running.");
      }
    } finally {
      if (inFlightQueryRef.current === trimmed) {
        inFlightQueryRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleToggleCompare = (product: UnifiedProduct) => {
    if (selectedCompareIds.includes(product.id)) {
      setSelectedCompareIds(selectedCompareIds.filter((id) => id !== product.id));
    } else {
      if (selectedCompareIds.length >= 6) {
        alert("You can compare up to 6 products at once.");
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, product.id]);
    }
  };

  const handleToggleSave = async (product: UnifiedProduct) => {
    if (product.is_saved) {
      await apiClient.removeSaved(product.id);
      product.is_saved = false;
      setSavedCount((prev) => Math.max(0, prev - 1));
    } else {
      await apiClient.saveProduct(product);
      product.is_saved = true;
      setSavedCount((prev) => prev + 1);
    }

    if (searchResponse) {
      setSearchResponse({ ...searchResponse });
    }
  };

  // Derive products currently selected for comparison
  const allProducts = searchResponse?.products || [];
  const selectedCompareProducts = allProducts.filter((p) =>
    selectedCompareIds.includes(p.id)
  );

  return (
    <div className="app-shell">
      {/* 1. Global Navigation Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setActiveTab(tab);
        }}
        compareCount={selectedCompareIds.length}
        savedCount={savedCount}
        status={systemStatus}
        onSearch={(q) => handleSearch(q)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAIConfig={() => setIsConfigOpen(true)}
        loading={loading}
      />

      {/* 2. Main Page Content Routing */}
      <main className="main-content" style={{ paddingTop: "28px" }}>
        {activeTab === "home" && (
          <HomePage
            onSearch={(q) => handleSearch(q)}
            onTabChange={(tab) => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setActiveTab(tab);
            }}
            recommendedProducts={allProducts}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onQuickView={() => {
              // Open explore
              setActiveTab("explore");
            }}
            loading={loading}
          />
        )}

        {activeTab === "explore" && (
          <ExplorePage
            searchResponse={searchResponse}
            loading={loading}
            searchError={searchError}
            onSearch={(q, s) => handleSearch(q, s)}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeTab === "assistant" && (
          <AIAssistantPage
            currentProducts={allProducts}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onExecuteSearch={(q) => {
              handleSearch(q);
              setActiveTab("explore");
            }}
          />
        )}

        {activeTab === "compare" && (
          <ComparePage
            products={selectedCompareProducts}
            onRemove={(id) => setSelectedCompareIds(selectedCompareIds.filter((pId) => pId !== id))}
            onClear={() => setSelectedCompareIds([])}
            onTabChange={(tab) => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setActiveTab(tab);
            }}
            onToggleSave={handleToggleSave}
          />
        )}
      </main>

      {/* 3. Global Footer (shown on Home, Explore, Assistant) */}
      {activeTab !== "compare" && (
        <Footer
          onTabChange={(tab) => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveTab(tab);
          }}
          onOpenAIConfig={() => setIsConfigOpen(true)}
        />
      )}

      {/* 4. Floating Comparison Queue (visible across all pages when products are selected) */}
      <ComparisonDrawer
        selectedProducts={selectedCompareProducts}
        maxSlots={4}
        onRemove={(id) => setSelectedCompareIds(selectedCompareIds.filter((pId) => pId !== id))}
        onClear={() => setSelectedCompareIds([])}
        onOpenCompare={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setActiveTab("compare");
        }}
      />

      {/* 5. User Profile & System Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        status={systemStatus}
        savedCount={savedCount}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAIConfig={() => setIsConfigOpen(true)}
      />

      {/* 6. Wishlist / Saved Products Slide-over Drawer */}
      <SavedDrawer
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        onProductRemoved={() => {
          loadSavedCount();
          if (searchResponse) {
            setSearchResponse({ ...searchResponse });
          }
        }}
        onAddCompare={(p) => {
          if (!selectedCompareIds.includes(p.id)) {
            setSelectedCompareIds([...selectedCompareIds, p.id]);
          }
        }}
      />

      {/* 7. Search History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuery={(q) => {
          handleSearch(q);
          setActiveTab("explore");
        }}
      />

      {/* 8. ScaleMax AI Config Modal */}
      <AIConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        status={systemStatus}
        onConfigSaved={() => {
          loadStatus();
        }}
      />
    </div>
  );
}

export default App;
