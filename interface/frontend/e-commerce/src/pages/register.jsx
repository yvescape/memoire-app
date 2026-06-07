import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [accepted, setAccepted] = useState(false);

  const getStrength = (pw) => {
    if (pw.length === 0) return 0;
    if (pw.length < 6) return 1;
    if (pw.length < 10) return 2;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 4;
    return 3;
  };

  const strength = getStrength(form.password);
  const strengthLabels = ["", "Faible", "Moyen", "Fort", "Très fort"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validations côté client
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (!accepted) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          password: form.password,
          password_confirm: form.confirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erreurs par champ (Django REST renvoie { field: [errors] })
        if (typeof data === "object" && !data.detail) {
          const errors = {};
          let firstMsg = "";
          for (const [key, val] of Object.entries(data)) {
            const msg = Array.isArray(val) ? val[0] : val;
            errors[key] = msg;
            if (!firstMsg) firstMsg = msg;
          }
          setFieldErrors(errors);
          setError(firstMsg);
        } else {
          throw new Error(data.detail || "Une erreur est survenue.");
        }
        return;
      }

      // Inscription réussie → rediriger vers login
      navigate("/login", { state: { registered: true } });
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
          src="https://images.unsplash.com/photo-1506377711776-dbdc2f3c20d9?w=1000&q=80"
          alt="Parfum"
        />
        <div className="auth-image-overlay" />
        <div className="auth-image-text">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Rejoignez-nous
          </p>
          <h2>
            Une expérience
            <br />
            <em>sur mesure</em>
          </h2>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <div className="auth-logo" onClick={() => navigate("/")}>
            PARFUM
          </div>
          <div className="auth-header">
            <h1 className="auth-title">Inscription</h1>
            <div className="divider-left">
              <div className="divider" style={{ margin: "1rem 0" }} />
            </div>
            <p className="auth-subtitle">Créez votre compte en quelques instants</p>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="input-group">
                <input
                  id="reg-firstName"
                  type="text"
                  placeholder=" "
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className={fieldErrors.first_name ? "input-error" : ""}
                />
                <label htmlFor="reg-firstName">Prénom</label>
                <div className="input-line" />
              </div>
              <div className="input-group">
                <input
                  id="reg-lastName"
                  type="text"
                  placeholder=" "
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className={fieldErrors.last_name ? "input-error" : ""}
                />
                <label htmlFor="reg-lastName">Nom</label>
                <div className="input-line" />
              </div>
            </div>

            <div className="input-group">
              <input
                id="reg-email"
                type="email"
                placeholder=" "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={fieldErrors.email ? "input-error" : ""}
              />
              <label htmlFor="reg-email">Adresse e-mail</label>
              <div className="input-line" />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>

            {/* Mot de passe */}
            <div className="input-group password-group">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className={fieldErrors.password ? "input-error" : ""}
              />
              <label htmlFor="reg-password">Mot de passe</label>
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
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            {form.password.length > 0 && (
              <div style={{ marginTop: "-0.8rem", marginBottom: "0.5rem" }}>
                <div className="password-strength">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`strength-bar ${
                        strength >= n ? (strength >= 4 ? "strong" : "active") : ""
                      }`}
                    />
                  ))}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {strengthLabels[strength]}
                </p>
              </div>
            )}

            {/* Confirmation */}
            <div className="input-group password-group">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? "text" : "password"}
                placeholder=" "
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
              <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
              <div className="input-line" />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
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

            {form.password && form.confirm && (
              <div style={{ marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    color: form.password === form.confirm ? "#4caf50" : "#f44336",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {form.password === form.confirm ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Les mots de passe correspondent
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Les mots de passe ne correspondent pas
                    </>
                  )}
                </p>
              </div>
            )}

            <label className="checkbox-label" style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                J'accepte les{" "}
                <span className="auth-link" onClick={() => navigate("/legal")}>
                  conditions d'utilisation
                </span>{" "}
                et la{" "}
                <span className="auth-link" onClick={() => navigate("/legal")}>
                  politique de confidentialité
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              style={{ marginTop: "1rem" }}
              disabled={loading}
            >
              {loading ? "Création en cours…" : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-switch">
            Déjà membre ?{" "}
            <span className="auth-link" onClick={() => navigate("/login")}>
              Se connecter
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}