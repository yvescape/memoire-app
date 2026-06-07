import { useState, useEffect, useCallback } from "react";
import "../styles/products.css";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";
import { authFetch, isAuthenticated } from "../utils/auth";

const FAMILIES = ["Tous", "Floral", "Oriental", "Boisé", "Hespéridé", "Aromatique"];
const GENDERS = ["Tous", "Femme", "Homme", "Mixte", "Unisexe"];
const ITEMS_PER_PAGE = 8;

const getSessionId = () => {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
};

export default function Products() {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFamily, setSelectedFamily] = useState("Tous");
  const [selectedGender, setSelectedGender] = useState("Tous");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Like & cart state par produit : { [productId]: { liked, likeCount, inCart, cartQty, cartItemId } }
  const [productStates, setProductStates] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // ─── FETCH PRODUCTS ───
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let all = [];
        let page = 1;
        let total = Infinity;
        while (all.length < total) {
          const response = await fetch(`/api/products/?page=${page}`);
          if (!response.ok) throw new Error(`Erreur ${response.status}`);
          const data = await response.json();
          total = data.count ?? data.results?.length ?? 0;
          all = [...all, ...data.results];
          if (all.length >= total || data.results.length === 0) break;
          page++;
        }
        setAllProducts(all);
      } catch (err) {
        console.error("Erreur chargement produits:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ─── FETCH SUMMARIES & CART STATUS ───
  const fetchProductStates = useCallback(async (products) => {
    const states = {};

    // Single bulk request for all summaries instead of N individual calls
    try {
      const ids = products.map((p) => p.id);
      const body = JSON.stringify({ ids });
      const res = isLoggedIn
        ? await authFetch("/api/interation/bulk-summary/", { method: "POST", body })
        : await fetch("/api/interation/bulk-summary/", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (res && res.ok) {
        const summaries = await res.json();
        for (const [productId, data] of Object.entries(summaries)) {
          states[productId] = {
            ...states[productId],
            liked: data.liked || false,
            likeCount: data.total_likes || 0,
            avgRating: data.average_rating || 0,
            totalRatings: data.total_ratings || 0,
          };
        }
      }
    } catch { /* ignore fetch errors */ }

    // Cart checks remain per-product (no bulk endpoint)
    await Promise.all(
      products.map(async (product) => {
        try {
          const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
          const res = isLoggedIn
            ? await authFetch(`/api/orders/orders_item/check/${product.id}/${sessionParam}`)
            : await fetch(`/api/orders/orders_item/check/${product.id}/${sessionParam}`);
          if (res && res.ok) {
            const data = await res.json();
            states[product.id] = {
              ...states[product.id],
              inCart: data.in_cart || false,
              cartQty: data.quantity || 0,
              cartItemId: data.item_id || null,
            };
          }
        } catch { /* ignore fetch errors */ }
      })
    );

    setProductStates((prev) => ({ ...prev, ...states }));
  }, [isLoggedIn]);

  // Fetch states quand les produits changent
  useEffect(() => {
    if (allProducts.length > 0) {
      fetchProductStates(allProducts);
    }
  }, [allProducts, fetchProductStates]);

  // ─── TOGGLE LIKE ───
  const handleToggleLike = async (e, productId) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }

    setActionLoading((prev) => ({ ...prev, [`like-${productId}`]: true }));
    try {
      const res = await authFetch(`/api/interation/${productId}/toggle-like/`, { method: "POST" });
      if (!res) { navigate("/login"); return; }
      const data = await res.json();
      setProductStates((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          liked: data.liked ?? !prev[productId]?.liked,
          likeCount: data.liked
            ? (prev[productId]?.likeCount || 0) + 1
            : Math.max((prev[productId]?.likeCount || 1) - 1, 0),
        },
      }));
    } catch (err) {
      console.error("Erreur like:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`like-${productId}`]: false }));
    }
  };

  // ─── ADD TO CART ───
  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [`cart-${productId}`]: true }));
    try {
      const body = { product_id: Number(productId) };
      if (!isLoggedIn) body.session_id = getSessionId();

      const res = isLoggedIn
        ? await authFetch("/api/orders/orders_item/cart/items/", { method: "POST", body: JSON.stringify(body) })
        : await fetch("/api/orders/orders_item/cart/items/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (res && res.ok) {
        // Re-check cart pour ce produit
        const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
        const checkRes = isLoggedIn
          ? await authFetch(`/api/orders/orders_item/check/${productId}/${sessionParam}`)
          : await fetch(`/api/orders/orders_item/check/${productId}/${sessionParam}`);
        if (checkRes && checkRes.ok) {
          const data = await checkRes.json();
          setProductStates((prev) => ({
            ...prev,
            [productId]: { ...prev[productId], inCart: data.in_cart, cartQty: data.quantity, cartItemId: data.item_id },
          }));
        }
        window.dispatchEvent(new Event("cart-change"));
      }
    } catch (err) {
      console.error("Erreur ajout panier:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`cart-${productId}`]: false }));
    }
  };

  // ─── QUANTITY CHANGE ───
  const handleQuantityChange = async (e, productId, action) => {
    e.stopPropagation();
    const state = productStates[productId];
    if (!state?.cartItemId) return;

    setActionLoading((prev) => ({ ...prev, [`cart-${productId}`]: true }));
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      await (isLoggedIn
        ? authFetch(`/api/orders/orders_item/cart/items/${state.cartItemId}/quantity/${sessionParam}`, { method: "PATCH", body: JSON.stringify({ action, amount: 1 }) })
        : fetch(`/api/orders/orders_item/cart/items/${state.cartItemId}/quantity/${sessionParam}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, amount: 1 }) }));

      // Re-check cart
      const checkRes = isLoggedIn
        ? await authFetch(`/api/orders/orders_item/check/${productId}/${sessionParam}`)
        : await fetch(`/api/orders/orders_item/check/${productId}/${sessionParam}`);
      if (checkRes && checkRes.ok) {
        const data = await checkRes.json();
        setProductStates((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], inCart: data.in_cart, cartQty: data.quantity, cartItemId: data.item_id },
        }));
      }
      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      console.error("Erreur quantité:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`cart-${productId}`]: false }));
    }
  };

  // ─── FILTERS & SEARCH ───
  const filtered = allProducts
    .filter((p) => selectedFamily === "Tous" || p.family === selectedFamily)
    .filter((p) => selectedGender === "Tous" || p.gender === selectedGender)
    .sort((a, b) => {
      if (sortBy === "price-asc") return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "price-desc") return parseFloat(b.price) - parseFloat(a.price);
      return 0;
    });

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const q = query.toLowerCase();
    const results = allProducts.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q) ||
      (p.family || "").toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
    setSearchResults(results);
    setIsSearching(false);
  };

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFamilyChange = (f) => { setSelectedFamily(f); setCurrentPage(1); };
  const handleGenderChange = (g) => { setSelectedGender(g); setCurrentPage(1); };
  const handleSortChange = (e) => { setSortBy(e.target.value); setCurrentPage(1); };
  const goToPage = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const formatPrice = (price) => Math.round(parseFloat(price)).toLocaleString("fr-FR");

  // ─── PRODUCT CARD ───
  const ProductCard = ({ product, i }) => {
    const state = productStates[product.id] || {};
    const isCartLoading = actionLoading[`cart-${product.id}`];
    const isLikeLoading = actionLoading[`like-${product.id}`];

    return (
      <div
        className="product-card"
        style={{ animationDelay: `${i * 0.07}s` }}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {product.badge && <div className="product-badge">{product.badge}</div>}

        {/* Like button */}
        <button
          className={`product-like-btn ${state.liked ? "liked" : ""}`}
          onClick={(e) => handleToggleLike(e, product.id)}
          disabled={isLikeLoading}
          title={state.liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill={state.liked ? "var(--navy)" : "none"}
            stroke={state.liked ? "var(--navy)" : "currentColor"}
            strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <div className="product-image-wrap">
          <img src={product.image} alt={product.name} className="product-image" />
          <div className="product-card-overlay">
            {state.inCart ? (
              <div className="card-qty-controls" onClick={(e) => e.stopPropagation()}>
                <button className="card-qty-btn" onClick={(e) => handleQuantityChange(e, product.id, "decrement")} disabled={isCartLoading}>−</button>
                <span className="card-qty-value">{isCartLoading ? "…" : state.cartQty}</span>
                <button className="card-qty-btn" onClick={(e) => handleQuantityChange(e, product.id, "increment")} disabled={isCartLoading}>+</button>
              </div>
            ) : (
              <button
                className="btn btn-gold quick-add"
                onClick={(e) => handleAddToCart(e, product.id)}
                disabled={isCartLoading}
              >
                {isCartLoading ? "Ajout…" : "Ajouter au panier"}
              </button>
            )}
            <button
              className="btn btn-ghost"
              style={{ background: "rgba(235,231,225,0.9)", border: "none", marginTop: "0.5rem", width: "100%" }}
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
            >
              Voir le détail
            </button>
          </div>
        </div>

        <div className="product-info">
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            <span className="product-size">{product.size}</span>
          </div>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-notes">{product.notes}</p>
          <div className="product-bottom">
            <p className="card-price">{formatPrice(product.price)} FCFA</p>
            {state.inCart && (
              <span className="card-in-cart-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Panier
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="products-page">
      <div className="products-hero">
        <img src="https://images.unsplash.com/photo-1631573580046-fec871ac2a32?w=1600&q=80" alt="Collection" className="products-hero-img" />
        <div className="products-hero-overlay" />
        <div className="products-hero-content">
          <p className="section-label" style={{ color: "var(--gold)" }}>Maison Parfum</p>
          <h1>Notre <em>Collection</em></h1>
          <div className="divider" />
          <p>Des fragrances créées pour chaque moment de vie</p>
        </div>
      </div>

      <div className="products-filters">
        <div className="filters-row">
          <div className="filter-group">
            <span className="filter-label">Famille olfactive</span>
            <div className="filter-pills">
              {FAMILIES.map((f) => (
                <button key={f} className={`filter-pill ${selectedFamily === f ? "active" : ""}`} onClick={() => handleFamilyChange(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">Pour</span>
            <div className="filter-pills">
              {GENDERS.map((g) => (
                <button key={g} className={`filter-pill ${selectedGender === g ? "active" : ""}`} onClick={() => handleGenderChange(g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="filter-group search-group">
            <span className="filter-label">Recherche</span>
            <div className="search-container permanent">
              <div className="search-wrapper">
                <input type="text" className="search-input" placeholder="Nom, notes, famille..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
                {searchQuery && (
                  <button className="search-clear" onClick={clearSearch}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="filter-group filter-group--right">
            <span className="filter-label">Trier</span>
            <select className="filter-select" value={sortBy} onChange={handleSortChange}>
              <option value="default">Par défaut</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
        <div className="filters-bottom">
          <p className="products-count">
            {searchQuery ? (
              <>{searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} pour "{searchQuery}"</>
            ) : (
              <>{filtered.length} fragrance{filtered.length > 1 ? "s" : ""}{filtered.length > 0 && ` (page ${currentPage}/${totalPages})`}</>
            )}
          </p>
          {isSearching && <div className="search-spinner"><div className="spinner"></div></div>}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem" }}>Chargement de la collection…</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Impossible de charger les produits.</p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {searchQuery ? (
            <div className="search-results-section">
              <h2 className="search-results-title">Résultats de recherche</h2>
              {searchResults.length > 0 ? (
                <div className="products-grid">
                  {searchResults.map((product, i) => <ProductCard key={product.id} product={product} i={i} />)}
                </div>
              ) : (
                <div className="no-results">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <p>Aucun résultat trouvé pour "{searchQuery}"</p>
                  <button className="btn btn-outline" onClick={clearSearch}>Effacer la recherche</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="products-grid">
                {paginatedProducts.map((product, i) => <ProductCard key={product.id} product={product} i={i} />)}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} className={`pagination-page ${currentPage === page ? "active" : ""}`} onClick={() => goToPage(page)}>{page}</button>
                    ))}
                  </div>
                  <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}