import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { setTokens } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Django REST renvoie les erreurs sous différents formats
        const msg =
          data.non_field_errors?.[0] ||
          data.detail ||
          (typeof data === "object" && Object.values(data).flat()[0]) ||
          "Identifiants invalides.";
        throw new Error(msg);
      }

      setTokens(data.access, data.refresh);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-image">
        <img
          src="https://images.unsplash.com/photo-1597773150796-e5c14ebecbf5?w=1000&q=80"
          alt="Parfum"
        />
        <div className="auth-image-overlay" />
        <div className="auth-image-text">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Bienvenue
          </p>
          <h2>
            L'élégance
            <br />
            <em>vous attend</em>
          </h2>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <div className="auth-logo" onClick={() => navigate("/")}>
            PARFUM
          </div>
          <div className="auth-header">
            <h1 className="auth-title">Connexion</h1>
            <div className="divider-left">
              <div className="divider" style={{ margin: "1rem 0" }} />
            </div>
            <p className="auth-subtitle">Accédez à votre espace personnel</p>
          </div>

          <form className="auth-fields" onSubmit={handleSubmit}>
            {/* Message d'erreur */}
            {error && (
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <input
                id="login-email"
                type="email"
                placeholder=" "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <label htmlFor="login-email">Adresse e-mail</label>
              <div className="input-line" />
            </div>

            <div className="input-group password-group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <label htmlFor="login-password">Mot de passe</label>
              <div className="input-line" />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="auth-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
              <span className="auth-link" onClick={() => navigate("/forgot-password")}>
                Mot de passe oublié ?
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>

            <div className="auth-divider-text">
              <span>ou continuer avec</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Pas encore de compte ?{" "}
            <span className="auth-link" onClick={() => navigate("/register")}>
              Créer un compte
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}