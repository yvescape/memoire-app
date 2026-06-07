import { useState } from "react";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email | sent
  const [email, setEmail] = useState("");

  if (step === "sent") {
    return (
      <div className="auth-page">
        <div className="auth-image">
          <img
            src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1000&q=80"
            alt="Parfum"
          />
          <div className="auth-image-overlay" />
          <div className="auth-image-text">
            <p className="section-label" style={{ color: "var(--gold)" }}>
              Vérifiez votre boîte
            </p>
            <h2>
              Email
              <br />
              <em>envoyé</em>
            </h2>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-inner">
            <div className="auth-logo" onClick={() => navigate("/")}>
              PARFUM
            </div>
            <div className="auth-success">
              <div className="auth-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 300,
                color: "var(--navy)",
                marginBottom: "1rem",
              }}>
                Vérifiez votre e-mail
              </h2>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "2rem",
              }}>
                Un lien de réinitialisation a été envoyé à{" "}
                <strong style={{ color: "var(--navy)" }}>{email}</strong>.
                <br />
                Vérifiez votre dossier spam si vous ne le trouvez pas.
              </p>
              <button className="btn btn-primary" onClick={() => navigate("/login")}>
                Retour à la connexion
              </button>
              <p style={{ marginTop: "1.5rem", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Pas reçu ?{" "}
                <span className="auth-link" onClick={() => setStep("email")}>
                  Renvoyer
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-image">
        <img
          src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1000&q=80"
          alt="Parfum"
        />
        <div className="auth-image-overlay" />
        <div className="auth-image-text">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Assistance
          </p>
          <h2>
            Retrouvez
            <br />
            <em>votre accès</em>
          </h2>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <div className="auth-logo" onClick={() => navigate("/")}>
            PARFUM
          </div>

          <button
            onClick={() => navigate("/login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "2rem",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            Retour
          </button>

          <div className="auth-header">
            <h1 className="auth-title">Mot de passe oublié</h1>
            <div className="divider-left">
              <div className="divider" style={{ margin: "1rem 0" }} />
            </div>
            <p className="auth-subtitle">
              Saisissez votre adresse e-mail et nous vous enverrons un lien
              pour réinitialiser votre mot de passe.
            </p>
          </div>

          <div className="auth-fields">
            <div className="input-group">
              <input
                id="reset-email"
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="reset-email">Adresse e-mail</label>
              <div className="input-line" />
            </div>

            <button
              className="btn btn-primary auth-submit"
              style={{ marginTop: "1rem" }}
              onClick={() => email && setStep("sent")}
            >
              Envoyer le lien
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}