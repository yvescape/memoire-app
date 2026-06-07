import { useState, useEffect, useCallback } from "react";
import "../styles/cart.css";
import { useNavigate } from "react-router-dom";
import { authFetch, isAuthenticated } from "../utils/auth";

const getSessionId = () => {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
};

export default function Cart() {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  const [items, setItems] = useState([]);
  const [order, setOrder] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [promoCode, setPromoCode] = useState("");

  const formatPrice = (price) => Math.round(parseFloat(price || 0)).toLocaleString("fr-FR");

  // ─── FETCH ORDER (items + pricing) ───
  // Remplace tout le fetchCart par :

  const fetchCart = useCallback(async () => {
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";

      // Récupérer les commandes (la pending sera la première)
      const ordersRes = isLoggedIn
        ? await authFetch(`/api/orders/my/${sessionParam}`)
        : await fetch(`/api/orders/my/${sessionParam}`);

      if (!ordersRes || !ordersRes.ok) {
        setItems([]);
        setOrder(null);
        setPricing(null);
        return;
      }

      const ordersData = await ordersRes.json();
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.results || [];

      // Trouver la commande pending
      const pendingOrder = orders.find((o) => o.status === "pending");

      if (!pendingOrder) {
        setItems([]);
        setOrder(null);
        setPricing(null);
        return;
      }

      // Fetch le detail complet de la commande (avec pricing)
      const detailRes = isLoggedIn
        ? await authFetch(`/api/orders/${pendingOrder.id}/${sessionParam}`)
        : await fetch(`/api/orders/${pendingOrder.id}/${sessionParam}`);

      if (!detailRes || !detailRes.ok) {
        setItems([]);
        return;
      }

      const orderData = await detailRes.json();
      setOrder(orderData);
      setItems(orderData.items || []);
      setPricing(orderData.pricing || null);
    } catch (err) {
      console.error("Erreur chargement panier:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ─── UPDATE QUANTITY ───
  const handleQuantity = async (item, action) => {
    setActionLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const response = isLoggedIn
        ? await authFetch(`/api/orders/orders_item/cart/items/${item.id}/quantity/${sessionParam}`, {
            method: "PATCH",
            body: JSON.stringify({ action, amount: 1 }),
          })
        : await fetch(`/api/orders/orders_item/cart/items/${item.id}/quantity/${sessionParam}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, amount: 1 }),
          });

      if (response && response.ok) {
        const data = await response.json();

        // Si la réponse contient une quantité, c'est une mise à jour
        if (data.quantity != null) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, quantity: data.quantity, total: data.total } : i))
          );
        } else {
          // Sinon l'item a été supprimé
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        }
      } else {
        // Erreur ou 404 → item supprimé
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }

      await refreshPricing();
      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      console.error("Erreur quantité:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // ─── REMOVE ITEM ───
  const handleRemove = async (item) => {
    setActionLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      isLoggedIn
        ? await authFetch(`/api/orders/orders_item/cart/items/${item.id}/${sessionParam}`, { method: "DELETE" })
        : await fetch(`/api/orders/orders_item/cart/items/${item.id}/${sessionParam}`, { method: "DELETE" });

      const remaining = items.filter((i) => i.id !== item.id);
      setItems(remaining);

      if (remaining.length === 0) {
        setOrder(null);
        setPricing(null);
      } else {
        await refreshPricing();
      }

      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // ─── REFRESH PRICING ───
  const refreshPricing = async () => {
    if (!order?.id) return;
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const res = isLoggedIn
        ? await authFetch(`/api/orders/${order.id}/${sessionParam}`)
        : await fetch(`/api/orders/${order.id}/${sessionParam}`);

      if (res && res.ok) {
        const data = await res.json();
        setOrder(data);
        setPricing(data.pricing || null);
      }
    } catch (err) {
      console.error("Erreur refresh pricing:", err);
    }
  };

  // ─── CALCULS ───
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = pricing ? parseFloat(pricing.subtotal) || itemsSubtotal : itemsSubtotal;
  const shipping = pricing ? parseFloat(pricing.delivery_price) : 0;
  const total = pricing ? parseFloat(pricing.total) || (subtotal + shipping) : subtotal;
  const currency = "FCFA";
  const deliveryLabel = pricing?.delivery_option?.name || "Livraison";
  const deliveryDesc = pricing?.delivery_option?.description || "";

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <p className="section-label">Mon panier</p>
          <h1 className="cart-title">Chargement…</h1>
        </div>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  // ─── EMPTY ───
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <p className="section-label">Mon panier</p>
          <h1 className="cart-title">
            Votre panier est <em>vide</em>
          </h1>
          <div className="divider" />
        </div>
        <div className="cart-empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="empty-text">
            Vous n'avez encore aucun article dans votre panier.
            <br />
            Découvrez notre collection et laissez-vous séduire.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/products")}>
            Découvrir la collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <p className="section-label">Mon panier</p>
        <h1 className="cart-title">
          Votre sélection ({totalItems} article{totalItems > 1 ? "s" : ""})
        </h1>
        <div className="divider" />
      </div>

      <div className="cart-content">
        {/* Items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className={`cart-item ${actionLoading[item.id] ? "cart-item-loading" : ""}`}>
              <div className="cart-item-image">
                <img src={item.product_image} alt={item.product_name} />
              </div>
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.product_name}</h3>
                {item.product_size && (
                  <p className="cart-item-size">Taille : {item.product_size}</p>
                )}
                <p className="cart-item-unit-price">{formatPrice(item.price)} FCFA / unité</p>
              </div>
              <div className="cart-item-right">
                <div className="cart-qty">
                  <button onClick={() => handleQuantity(item, "decrement")} disabled={actionLoading[item.id]}>−</button>
                  <span>{actionLoading[item.id] ? "…" : item.quantity}</span>
                  <button onClick={() => handleQuantity(item, "increment")} disabled={actionLoading[item.id]}>+</button>
                </div>
                <p className="cart-item-price">{formatPrice(item.total || item.price * item.quantity)} FCFA</p>
                <button className="cart-remove" aria-label={`Supprimer ${item.product_name}`} onClick={() => handleRemove(item)} disabled={actionLoading[item.id]}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <div className="cart-continue">
            <button className="btn btn-ghost" onClick={() => navigate("/products")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
              </svg>
              Continuer les achats
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <div className="summary-card">
            <h2 className="summary-title">Résumé de commande</h2>
            <div className="divider" style={{ margin: "1.5rem 0" }} />

            <div className="summary-rows">
            <div className="summary-row">
              <span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span>
              <span>{formatPrice(subtotal)} {currency}</span>
            </div>
            <div className="summary-row">
              <span>
                {deliveryLabel || "Livraison"}
                {deliveryDesc && <small style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 300 }}>{deliveryDesc}</small>}
              </span>
              <span className={shipping === 0 ? "free-shipping" : ""}>
                {shipping === 0 ? "Gratuite" : `${formatPrice(shipping)} ${currency}`}
              </span>
            </div>
          </div>

          <div className="summary-divider" />
          <div className="summary-total">
            <span>Total</span>
            <span>{formatPrice(total)} {currency}</span>
          </div>

            <div className="promo-row">
              <input className="promo-input" type="text" placeholder="Code promo" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <button className="btn btn-ghost" style={{ padding: "0.7rem 1.2rem", fontSize: "0.7rem" }}>Appliquer</button>
            </div>

            <button
              className="btn btn-primary checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Procéder au paiement
            </button>

            <div className="summary-secure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Paiement 100% sécurisé</span>
            </div>

            <div className="payment-icons">
              {["VISA", "MC", "AMEX", "PP"].map((p) => (
                <span key={p} className="payment-icon">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}