import { useEffect, useState } from "react";
import "../styles/orderconfirmation.css";
import { useNavigate } from "react-router-dom";


export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [orderNumber] = useState(() => `PF-${Math.floor(Math.random() * 90000) + 10000}`);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className="confirmation-page">
      <div className={`confirmation-inner ${visible ? "visible" : ""}`}>
        {/* Icon */}
        <div className="confirm-icon-wrap">
          <div className="confirm-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="confirm-rings">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
          </div>
        </div>

        <p className="section-label">Commande confirmée</p>
        <h1 className="confirm-title">
          Merci pour votre
          <br />
          <em>commande</em>
        </h1>
        <div className="divider" />
        <p className="confirm-subtitle">
          Un e-mail de confirmation a été envoyé à votre adresse.
          <br />
          Nous préparons votre commande avec le plus grand soin.
        </p>

        {/* Order card */}
        <div className="confirm-card">
          <div className="confirm-card-header">
            <div>
              <p className="confirm-card-label">Numéro de commande</p>
              <p className="confirm-card-value">{orderNumber}</p>
            </div>
            <div>
              <p className="confirm-card-label">Date</p>
              <p className="confirm-card-value">
                {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="confirm-card-label">Livraison estimée</p>
              <p className="confirm-card-value">3–5 jours ouvrés</p>
            </div>
          </div>

          <div className="confirm-timeline">
            {[
              { label: "Commande reçue", done: true, active: true },
              { label: "En préparation", done: false, active: false },
              { label: "Expédiée", done: false, active: false },
              { label: "Livrée", done: false, active: false },
            ].map((step, i) => (
              <div key={i} className="timeline-step">
                <div className={`timeline-dot ${step.active ? "active" : ""} ${step.done ? "done" : ""}`}>
                  {step.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {i < 3 && <div className="timeline-line" />}
                <span className={`timeline-label ${step.active ? "active" : ""}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="confirm-actions">
          <button className="btn btn-primary" onClick={() => navigate("/products")}>
            Continuer les achats
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("")}>
            Retour à l'accueil
          </button>
        </div>

        {/* Note */}
        <p className="confirm-note">
          Des questions ? Contactez notre service client à{" "}
          <span>contact@maison-parfum.fr</span>
        </p>
      </div>
    </div>
  );
}