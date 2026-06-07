import { useState, useEffect, useCallback } from "react";
import "../styles/productdetail.css";
import Footer from "../components/footer";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch, isAuthenticated } from "../utils/auth";

// Génère ou récupère un session_id pour les utilisateurs non connectés
const getSessionId = () => {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [p, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");

  // Cart state
  const [cartInfo, setCartInfo] = useState({ in_cart: false, quantity: 0, item_id: null });
  const [cartLoading, setCartLoading] = useState(false);

  // Interactions
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [summary, setSummary] = useState({ average_rating: 0, total_ratings: 0, total_likes: 0, liked: false });
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Formulaires
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState({ content: "" });
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);

  const [showRatingForm, setShowRatingForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const isLoggedIn = isAuthenticated();

  // ─── CHECK CART ───
  const checkCart = useCallback(async () => {
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const response = isLoggedIn
        ? await authFetch(`/api/orders/orders_item/check/${id}/${sessionParam}`)
        : await fetch(`/api/orders/orders_item/check/${id}/${sessionParam}`);
      if (!response || !response.ok) return;
      const data = await response.json();
      setCartInfo(data);
    } catch (err) {
      console.error("Erreur check cart:", err);
    }
  }, [id, isLoggedIn]);

  // ─── ADD TO CART ───
  const handleAddToCart = async () => {
    setCartLoading(true);
    try {
      const body = { product_id: Number(id) };
      if (!isLoggedIn) body.session_id = getSessionId();

      const response = isLoggedIn
        ? await authFetch("/api/orders/orders_item/cart/items/", {
            method: "POST",
            body: JSON.stringify(body),
          })
        : await fetch("/api/orders/orders_item/cart/items/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!response || !response.ok) {
        const err = await response?.json();
        console.error("Erreur ajout panier:", err);
        return;
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      checkCart();
      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      console.error("Erreur ajout panier:", err);
    } finally {
      setCartLoading(false);
    }
  };

  // ─── UPDATE QUANTITY ───
  const handleQuantityChange = async (action) => {
    if (!cartInfo.item_id) return;
    setCartLoading(true);
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const response = isLoggedIn
        ? await authFetch(`/api/orders/orders_item/cart/items/${cartInfo.item_id}/quantity/${sessionParam}`, {
            method: "PATCH",
            body: JSON.stringify({ action, amount: 1 }),
          })
        : await fetch(`/api/orders/orders_item/cart/items/${cartInfo.item_id}/quantity/${sessionParam}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, amount: 1 }),
          });

      if (!response || !response.ok) {
        // Si l'item a été supprimé (decrement à 0)
        if (response?.status === 404 || action === "decrement") {
          setCartInfo({ in_cart: false, quantity: 0, item_id: null });
          checkCart();
          window.dispatchEvent(new Event("cart-change"));
          return;
        }
      }

      checkCart();
      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      console.error("Erreur quantité:", err);
    } finally {
      setCartLoading(false);
    }
  };

  // ─── FETCH PRODUIT ───
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${id}/`);
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error("Erreur produit:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Check cart au chargement
  useEffect(() => {
    if (id) checkCart();
  }, [id, checkCart]);

  // ─── FETCH COMMENTAIRES ───
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/interation/${id}/comments/`);
      if (!response.ok) return;
      const data = await response.json();
      setComments(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erreur commentaires:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ─── FETCH SUMMARY ───
  const fetchSummary = async () => {
    try {
      const response = isLoggedIn
        ? await authFetch(`/api/interation/${id}/summary/`)
        : await fetch(`/api/interation/${id}/summary/`);
      if (!response || !response.ok) return;
      const data = await response.json();
      setSummary(data);
      if (data.liked !== undefined) setLiked(data.liked);
    } catch (err) {
      console.error("Erreur summary:", err);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchComments();
    fetchSummary();
  }, [id]);

  // ─── FETCH RELATED ───
  useEffect(() => {
    if (!p) return;
    const fetchRelated = async () => {
      try {
        const response = await fetch("/api/products/");
        if (!response.ok) return;
        const data = await response.json();
        setRelated(data.results.filter((item) => item.id !== p.id).slice(0, 3));
      } catch (err) {
        console.error("Erreur produits similaires:", err);
      }
    };
    fetchRelated();
  }, [p]);

  // ─── TOGGLE LIKE ───
  const handleToggleLike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    setLikeLoading(true);
    try {
      const response = await authFetch(`/api/interation/${id}/toggle-like/`, { method: "POST" });
      if (!response) { navigate("/login"); return; }
      const data = await response.json();
      setLiked(data.liked ?? !liked);
      fetchSummary();
    } catch (err) {
      console.error("Erreur like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  // ─── AJOUTER COMMENTAIRE ───
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!newComment.content.trim()) return;
    setCommentSubmitting(true);
    setCommentError("");
    try {
      const response = await authFetch(`/api/interation/${id}/comments/create/`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.content }),
      });
      if (!response) { navigate("/login"); return; }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.content?.[0] || "Erreur lors de l'envoi.");
      }
      setNewComment({ content: "" });
      setShowCommentForm(false);
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
      fetchComments();
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ─── AJOUTER NOTE ───
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    setRatingSubmitting(true);
    setRatingError("");
    try {
      const response = await authFetch(`/api/interation/${id}/rating/`, {
        method: "POST",
        body: JSON.stringify({ value: newRating }),
      });
      if (!response) { navigate("/login"); return; }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Erreur lors de l'envoi.");
      }
      setShowRatingForm(false);
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
      fetchSummary();
    } catch (err) {
      setRatingError(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // ─── HELPERS ───
  const formatPrice = (price) => Math.round(parseFloat(price)).toLocaleString("fr-FR");

  const getIngredients = () => {
    if (!p) return null;
    return {
      top: p.notes_top ? p.notes_top.split(", ") : [],
      heart: p.notes_heart ? p.notes_heart.split(", ") : [],
      base: p.notes_base ? p.notes_base.split(", ") : [],
    };
  };

  const getNotesInline = () => {
    if (!p) return "";
    return [p.notes_top, p.notes_heart, p.notes_base].filter(Boolean).join(" · ");
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const avgRating = summary.average_rating ? parseFloat(summary.average_rating).toFixed(1) : "0.0";

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="detail-page" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem" }}>Chargement du produit…</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (error || !p) {
    return (
      <div className="detail-page" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Impossible de charger ce produit.</p>
          <button className="btn btn-outline" onClick={() => navigate("/products")}>Retour à la collection</button>
        </div>
      </div>
    );
  }

  const ingredients = getIngredients();

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb">
        <span onClick={() => navigate("/")}>Accueil</span>
        <span>/</span>
        <span onClick={() => navigate("/products")}>Collection</span>
        <span>/</span>
        <span className="crumb-current">{p.name}</span>
      </div>

      <div className="detail-main">
        <div className="detail-image-section">
          <div className="detail-image-wrap">
            <img src={p.image} alt={p.name} className="detail-image" />
            {p.badge && <div className="detail-badge">{p.badge}</div>}
          </div>
          <div className="detail-image-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Livraison gratuite dès 120 000 FCFA · Retours 30 jours</span>
          </div>
        </div>

        <div className="detail-info">
          <p className="detail-category">
            {p.category}{p.family ? ` · ${p.family}` : ""}{p.gender ? ` · ${p.gender}` : ""}
          </p>
          <h1 className="detail-name">{p.name}</h1>
          <div className="detail-notes-inline">{getNotesInline()}</div>

          <div className="detail-rating-row">
            <div className="detail-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= Math.round(parseFloat(avgRating)) ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span className="rating-count">{avgRating} · {summary.total_ratings || 0} avis</span>
            </div>

            <button className={`like-btn ${liked ? "liked" : ""}`} onClick={handleToggleLike} disabled={likeLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "var(--navy)" : "none"} stroke={liked ? "var(--navy)" : "currentColor"} strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{summary.total_likes || 0}</span>
            </button>
          </div>

          <div className="detail-divider" />

          <p className="detail-desc">{p.advice || "Une fragrance d'exception, créée avec les meilleures matières premières pour une expérience olfactive unique."}</p>

          <div className="detail-sizes">
            <p className="detail-size-label">Taille</p>
            <div className="size-options">
              <button className="size-btn active">{p.size}<span>{formatPrice(p.price)} FCFA</span></button>
            </div>
          </div>

          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(p.price)} FCFA</span>
            <span className="detail-tax">TTC · Port offert</span>
          </div>

          {/* ─── CART ACTIONS ─── */}
          <div className="detail-actions">
            {cartInfo.in_cart ? (
              <>
                {/* Produit dans le panier → contrôles quantité */}
                <div className="qty-control">
                  <button onClick={() => handleQuantityChange("decrement")} disabled={cartLoading}>−</button>
                  <span>{cartLoading ? "…" : cartInfo.quantity}</span>
                  <button onClick={() => handleQuantityChange("increment")} disabled={cartLoading}>+</button>
                </div>
                <div className="cart-status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Dans votre panier</span>
                </div>
              </>
            ) : (
              <>
                {/* Produit pas dans le panier → bouton ajouter */}
                <button
                  className={`btn ${added ? "btn-gold" : "btn-primary"} detail-add-btn`}
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  style={{ width: "100%" }}
                >
                  {cartLoading ? "Ajout…" : added ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      Ajouté au panier
                    </span>
                  ) : "Ajouter au panier"}
                </button>
              </>
            )}
          </div>

          <button className="btn btn-ghost detail-cart-btn" onClick={() => navigate("/cart")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Voir le panier
          </button>

          {/* Tabs */}
          <div className="detail-tabs">
            <div className="tabs-nav">
              {["notes", "composition", "conseils", "avis"].map((tab) => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab === "notes" ? "Notes olfactives" : tab === "composition" ? "Composition" : tab === "conseils" ? "Conseils" : `Avis (${summary.total_ratings || 0})`}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === "notes" && ingredients && (
                <div className="notes-pyramid">
                  {[
                    { label: "Tête", items: ingredients.top, icon: "▲" },
                    { label: "Cœur", items: ingredients.heart, icon: "◆" },
                    { label: "Fond", items: ingredients.base, icon: "▼" },
                  ].map((layer) =>
                    layer.items.length > 0 ? (
                      <div key={layer.label} className="pyramid-row">
                        <div className="pyramid-label">
                          <span className="pyramid-icon">{layer.icon}</span>
                          <span>{layer.label}</span>
                        </div>
                        <div className="pyramid-items">
                          {layer.items.map((item) => (
                            <span key={item} className="pyramid-item">{item.trim()}</span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {activeTab === "composition" && (
                <p className="tab-text">{p.composition || "Alcool dénaturé (SD Alcohol 39-C), Parfum (Fragrance), Aqua (Water). Fabriqué en France."}</p>
              )}

              {activeTab === "conseils" && (
                <div className="tab-text">
                  <p>{p.advice || "Appliquer sur les points de chaleur : poignets, nuque, derrière les oreilles et creux du coude."}</p>
                </div>
              )}

              {activeTab === "avis" && (
                <div className="comments-section">
                  <div className="comments-header">
                    <div className="comments-stats">
                      <span className="comments-average">{avgRating}</span>
                      <div className="comments-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <svg key={n} width="16" height="16" viewBox="0 0 24 24" fill={n <= Math.round(parseFloat(avgRating)) ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth="1.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span className="comments-total">Basé sur {summary.total_ratings || 0} avis</span>
                    </div>

                    <div className="comments-actions-btns">
                      <button className="btn btn-outline comments-write-btn" onClick={() => {
                        if (!isLoggedIn) { navigate("/login"); return; }
                        setShowRatingForm(!showRatingForm);
                        setShowCommentForm(false);
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Noter
                      </button>
                      <button className="btn btn-outline comments-write-btn" onClick={() => {
                        if (!isLoggedIn) { navigate("/login"); return; }
                        setShowCommentForm(!showCommentForm);
                        setShowRatingForm(false);
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Commenter
                      </button>
                    </div>
                  </div>

                  {showRatingForm && (
                    <form className="comment-form" onSubmit={handleRatingSubmit}>
                      <h4 className="comment-form-title">Donnez votre note</h4>
                      {ratingError && <div className="auth-error" style={{ marginBottom: "1rem" }}><span>{ratingError}</span></div>}
                      <div className="comment-form-group">
                        <label>Votre note</label>
                        <div className="comment-rating-select">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <span key={r} className={`rating-star ${r <= newRating ? "active" : ""}`} onClick={() => setNewRating(r)}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="comment-form-actions">
                        <button type="submit" className="btn btn-gold" disabled={ratingSubmitting}>{ratingSubmitting ? "Envoi…" : "Envoyer ma note"}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowRatingForm(false)}>Annuler</button>
                      </div>
                    </form>
                  )}

                  {ratingSuccess && (
                    <div className="comment-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      Merci ! Votre note a été enregistrée.
                    </div>
                  )}

                  {showCommentForm && (
                    <form className="comment-form" onSubmit={handleCommentSubmit}>
                      <h4 className="comment-form-title">Partagez votre expérience</h4>
                      {commentError && <div className="auth-error" style={{ marginBottom: "1rem" }}><span>{commentError}</span></div>}
                      <div className="comment-form-group">
                        <label>Votre commentaire</label>
                        <textarea value={newComment.content} onChange={(e) => setNewComment({ content: e.target.value })} placeholder="Partagez votre expérience avec ce parfum..." rows="4" required />
                      </div>
                      <div className="comment-form-actions">
                        <button type="submit" className="btn btn-gold" disabled={commentSubmitting}>{commentSubmitting ? "Envoi…" : "Publier"}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowCommentForm(false)}>Annuler</button>
                      </div>
                    </form>
                  )}

                  {commentSuccess && (
                    <div className="comment-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      Merci ! Votre commentaire a été publié.
                    </div>
                  )}

                  {commentsLoading ? (
                    <div style={{ textAlign: "center", padding: "2rem 0" }}>
                      <div className="spinner" style={{ margin: "0 auto" }} />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="comments-list">
                      {comments.map((comment) => (
                        <div key={comment.id} className="comment-card">
                          <div className="comment-header">
                            <div className="comment-author-info">
                              <strong className="comment-author">{comment.user_email || "Anonyme"}</strong>
                            </div>
                            <span className="comment-date">{formatDate(comment.created_at || comment.date)}</span>
                          </div>
                          <p className="comment-content">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-comments">
                      <p>Aucun commentaire pour le moment. Soyez le premier à partager votre avis !</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="related-section">
          <div className="related-header">
            <p className="section-label">Vous aimerez aussi</p>
            <h2 className="section-title">Dans la même <em>famille</em></h2>
          </div>
          <div className="related-grid">
            {related.map((r) => (
              <div key={r.id} className="related-card" onClick={() => navigate(`/product/${r.id}`)}>
                <div className="related-image-wrap"><img src={r.image} alt={r.name} /></div>
                <p className="card-category">{r.category}</p>
                <h3 className="card-name">{r.name}</h3>
                <p className="card-price">{formatPrice(r.price)} FCFA</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer navigate={navigate} />
    </div>
  );
}