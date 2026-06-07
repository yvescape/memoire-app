import { useState, useEffect, useCallback } from "react";
import "../styles/checkout.css";
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

const STEPS = ["Livraison", "Paiement", "Confirmation"];

export default function Checkout() {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  const [step, setStep] = useState(0);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "Côte d'Ivoire",
    cardName: "", cardNumber: "", expiry: "", cvv: "",
    saveCard: false,
  });

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const formatPrice = (price) => Math.round(parseFloat(price || 0)).toLocaleString("fr-FR");
  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const formatCard = (val) => val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (val) => val.replace(/\D/g, "").replace(/^(.{2})(.*)/, "$1/$2").slice(0, 5);

  // ─── FETCH ORDER ───
  const fetchOrder = useCallback(async () => {
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const res = isLoggedIn
        ? await authFetch(`/api/orders/my/${sessionParam}`)
        : await fetch(`/api/orders/my/${sessionParam}`);

      if (!res || !res.ok) { setOrder(null); return; }

      const data = await res.json();
      const orders = Array.isArray(data) ? data : data.results || [];
      const pending = orders.find((o) => o.status === "pending");

      if (!pending) { navigate("/cart"); return; }

      // Fetch detail
      const detailRes = isLoggedIn
        ? await authFetch(`/api/orders/${pending.id}/${sessionParam}`)
        : await fetch(`/api/orders/${pending.id}/${sessionParam}`);

      if (detailRes && detailRes.ok) {
        const orderData = await detailRes.json();
        setOrder(orderData);

        // Pré-remplir le formulaire si adresse existante
        if (orderData.address) {
          const a = orderData.address;
          setForm((prev) => ({
            ...prev,
            firstName: a.first_name || prev.firstName,
            lastName: a.last_name || prev.lastName,
            email: a.email || prev.email,
            phone: a.mobile || a.phone || prev.phone,
            address: a.street || a.address || prev.address,
            city: a.city || prev.city,
            zip: a.zip_code || a.zip || prev.zip,
            country: a.country || prev.country,
          }));
        }
      }
    } catch (err) {
      console.error("Erreur chargement commande:", err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate]);

  // ─── FETCH ORDER ───
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ─── FETCH DELIVERY OPTIONS (une seule fois) ───
  useEffect(() => {
    const fetchDeliveryOptions = async () => {
      try {
        const res = await fetch("/api/orders/delivery-options/");
        if (!res.ok) return;
        const data = await res.json();
        const options = Array.isArray(data) ? data : data.results || [];
        setDeliveryOptions(options);
      } catch (err) {
        console.error("Erreur options livraison:", err);
      }
    };
    fetchDeliveryOptions();
  }, []);

  // ─── PRÉ-SÉLECTIONNER quand order ET options sont prêts ───
  useEffect(() => {
    if (!order || deliveryOptions.length === 0) return;
    const currentId = order.pricing?.delivery_option?.id;
    const current = deliveryOptions.find((o) => o.id === currentId);
    const defaultOpt = deliveryOptions.find((o) => o.is_default);
    setSelectedDelivery(current || defaultOpt || deliveryOptions[0]);
  }, [order, deliveryOptions]);

  // ─── SAVE ADDRESS ───
  const handleSaveAddress = async () => {
    if (!order?.id) return;
    setError("");
    setSubmitting(true);
    try {
      const body = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        mobile: form.phone,
        city: form.city,
        address_line: form.address,
      };
      if (!isLoggedIn) body.session_id = getSessionId();

      const res = isLoggedIn
        ? await authFetch("/api/orders/orders_address/", {
            method: "POST",
            body: JSON.stringify(body),
          })
        : await fetch("/api/orders/orders_address/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res || !res.ok) {
        const data = await res?.json();
        const msg = data?.detail || Object.values(data || {}).flat()[0] || "Erreur lors de la sauvegarde.";
        throw new Error(msg);
      }

      await fetchOrder();
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliveryChange = async (option) => {
    setSelectedDelivery(option);
    if (!order?.id) return;
    try {
      const sessionParam = !isLoggedIn ? `?session_id=${getSessionId()}` : "";
      const res = isLoggedIn
        ? await authFetch(`/api/orders/${order.id}/pricing/delivery/${sessionParam}`, {
            method: "PATCH",
            body: JSON.stringify({ delivery_option_id: option.id }),
          })
        : await fetch(`/api/orders/${order.id}/pricing/delivery/${sessionParam}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delivery_option_id: option.id }),
          });

      if (res && res.ok) {
        await fetchOrder();
      }
    } catch (err) {
      console.error("Erreur changement livraison:", err);
    }
  };

  // ─── CONFIRM ORDER ───
  const handleConfirmOrder = async () => {
    if (!order?.id) return;
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        order_id: order.id,
        order_pricing_id: order.pricing?.id,
        amount: Math.round(parseFloat(order.pricing?.total || 0)),
        currency: "FCFA",
        card_number: form.cardNumber.replace(/\s/g, ""),
        card_holder: form.cardName,
        expiration_date: form.expiry,
        cvv: form.cvv,
      };

      const res = isLoggedIn
        ? await authFetch("/api/payments/create/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/payments/create/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res?.json();
      if (!res || !res.ok || data?.status === "failed") {
        const msg = data?.detail || (Array.isArray(data) ? data[0] : Object.values(data || {}).flat()[0]) || "Paiement refusé. Vérifiez vos informations de carte.";
        throw new Error(msg);
      }

      window.dispatchEvent(new Event("cart-change"));
      navigate("/order-confirmation", { state: { orderId: order.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DATA ───
  const items = order?.items || [];
  const pricing = order?.pricing || null;
  const subtotal = pricing ? parseFloat(pricing.subtotal) : 0;
  const shipping = pricing ? parseFloat(pricing.delivery_price) : 0;
  const total = pricing ? parseFloat(pricing.total) : 0;
  const currency = "FCFA";
  const deliveryLabel = pricing?.delivery_option?.name || "Livraison";
  const deliveryDesc = pricing?.delivery_option?.description || "";
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="checkout-page">
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem" }}>Chargement de votre commande…</p>
        </div>
      </div>
    );
  }

  if (!order || items.length === 0) {
    return (
      <div className="checkout-page">
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Votre panier est vide.</p>
          <button className="btn btn-outline" onClick={() => navigate("/products")}>Découvrir la collection</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Progress */}
      <div className="checkout-progress">
        <div className="progress-logo" onClick={() => navigate("/")}>PARFUM</div>
        <div className="progress-steps">
          {STEPS.map((s, i) => (
            <div key={s} className="progress-step">
              <div className={`step-circle ${i <= step ? "active" : ""} ${i < step ? "done" : ""}`}>
                {i < step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`step-label ${i <= step ? "active" : ""}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? "done" : ""}`} />}
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => navigate("/cart")} style={{ padding: "0.5rem 1.2rem", fontSize: "0.7rem" }}>
          Retour au panier
        </button>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          {/* STEP 0: Livraison */}
          {step === 0 && (
            <div className="checkout-section animate-fade-up">
              <h2 className="checkout-section-title"><span>01</span>Adresse de livraison</h2>

              {error && <div className="auth-error" style={{ marginBottom: "1rem" }}><span>{error}</span></div>}

              <div className="form-grid-2">
                <div className="input-group">
                  <input id="co-firstName" type="text" placeholder=" " value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
                  <label htmlFor="co-firstName">Prénom *</label>
                  <div className="input-line" />
                </div>
                <div className="input-group">
                  <input id="co-lastName" type="text" placeholder=" " value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
                  <label htmlFor="co-lastName">Nom *</label>
                  <div className="input-line" />
                </div>
              </div>
              <div className="input-group">
                <input id="co-email" type="email" placeholder=" " value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                <label htmlFor="co-email">Adresse e-mail</label>
                <div className="input-line" />
              </div>
              <div className="input-group">
                <input id="co-phone" type="tel" placeholder=" " value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} required />
                <label htmlFor="co-phone">Téléphone *</label>
                <div className="input-line" />
              </div>
              <div className="input-group">
                <input id="co-city" type="text" placeholder=" " value={form.city} onChange={(e) => updateForm("city", e.target.value)} required />
                <label htmlFor="co-city">Ville *</label>
                <div className="input-line" />
              </div>

              {/* Delivery option */}
              {deliveryOptions.length > 0 && (
                <div className="shipping-options">
                  <h3 className="shipping-options-title">Mode de livraison</h3>
                  {deliveryOptions.map((option) => (
                    <label key={option.id} className="shipping-option">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedDelivery?.id === option.id}
                        onChange={() => handleDeliveryChange(option)}
                      />
                      <div className="shipping-option-content">
                        <div>
                          <strong>{option.name}</strong>
                          <span>{option.description}</span>
                        </div>
                        <strong>{formatPrice(option.amount)} {option.currency || currency}</strong>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "2rem" }}
                onClick={handleSaveAddress}
                disabled={submitting || !form.firstName || !form.lastName || !form.phone || !form.city}
              >
                {submitting ? "Enregistrement…" : "Continuer vers le paiement"}
              </button>
            </div>
          )}

          {/* STEP 1: Paiement */}
          {step === 1 && (
            <div className="checkout-section animate-fade-up">
              <h2 className="checkout-section-title"><span>02</span>Informations de paiement</h2>

              {error && <div className="auth-error" style={{ marginBottom: "1rem" }}><span>{error}</span></div>}

              <div className="card-visual">
                <div className="card-chip" />
                <div className="card-number-display">{form.cardNumber || "•••• •••• •••• ••••"}</div>
                <div className="card-footer-display">
                  <div>
                    <p>Titulaire</p>
                    <strong>{form.cardName || "NOM PRÉNOM"}</strong>
                  </div>
                  <div>
                    <p>Expiration</p>
                    <strong>{form.expiry || "MM/AA"}</strong>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <input id="co-cardName" type="text" placeholder=" " value={form.cardName} onChange={(e) => updateForm("cardName", e.target.value.toUpperCase())} />
                <label htmlFor="co-cardName">Nom sur la carte</label>
                <div className="input-line" />
              </div>
              <div className="input-group">
                <input id="co-cardNumber" type="text" placeholder=" " value={form.cardNumber} onChange={(e) => updateForm("cardNumber", formatCard(e.target.value))} maxLength="19" />
                <label htmlFor="co-cardNumber">Numéro de carte</label>
                <div className="input-line" />
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <input id="co-expiry" type="text" placeholder=" " value={form.expiry} onChange={(e) => updateForm("expiry", formatExpiry(e.target.value))} maxLength="5" />
                  <label htmlFor="co-expiry">Date d'expiration</label>
                  <div className="input-line" />
                </div>
                <div className="input-group">
                  <input id="co-cvv" type="text" placeholder=" " value={form.cvv} onChange={(e) => updateForm("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))} maxLength="3" />
                  <label htmlFor="co-cvv">CVV</label>
                  <div className="input-line" />
                </div>
              </div>

              <label className="checkbox-label" style={{ marginTop: "1rem" }}>
                <input type="checkbox" checked={form.saveCard} onChange={(e) => updateForm("saveCard", e.target.checked)} />
                <span>Sauvegarder cette carte pour mes prochains achats</span>
              </label>

              <div className="checkout-actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)}>Retour</button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                >
                  {submitting ? "Traitement…" : `Payer ${formatPrice(total)} ${currency}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="checkout-summary">
          <div className="checkout-summary-card">
            <h3 className="checkout-summary-title">Ma commande</h3>
            <div className="divider" style={{ margin: "1.5rem 0" }} />
            <div className="checkout-totals">
              <div className="checkout-total-row">
                <span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span>
                <span>{formatPrice(subtotal)} {currency}</span>
              </div>
              <div className="checkout-total-row">
                <span>
                  {deliveryLabel}
                  {deliveryDesc && <small style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)" }}>{deliveryDesc}</small>}
                </span>
                <span>{shipping === 0 ? "Gratuite" : `${formatPrice(shipping)} ${currency}`}</span>
              </div>
              <div className="checkout-total-row total">
                <span>Total TTC</span>
                <span>{formatPrice(total)} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}