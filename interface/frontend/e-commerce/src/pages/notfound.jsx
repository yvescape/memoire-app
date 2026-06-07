import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFound() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="notfound-page" data-loaded={loaded}>
      {/* Background decorative elements */}
      <div className="notfound-bg-pattern" />

      <div className="notfound-content">
        {/* Decorative perfume bottle silhouette */}
        <div className="notfound-icon">
          <svg
            viewBox="0 0 80 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="bottle-svg"
          >
            <rect x="30" y="8" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="40" y1="0" x2="40" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="35" y1="4" x2="45" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M28 20 Q28 28 18 36 Q8 48 8 68 L8 120 Q8 132 20 132 L60 132 Q72 132 72 120 L72 68 Q72 48 62 36 Q52 28 52 20Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M8 80 L72 80"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <path
              d="M18 36 Q40 42 62 36"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>
        </div>

        <p className="notfound-label">Page introuvable</p>

        <h1 className="notfound-title">
          4<em>0</em>4
        </h1>

        <div className="notfound-divider">
          <div className="notfound-divider-line" />
        </div>

        <p className="notfound-text">
          Cette fragrance semble s'être évaporée…
          <br />
          La page que vous cherchez n'existe plus ou a été déplacée.
        </p>

        <div className="notfound-actions">
          <button className="btn btn-gold" onClick={() => navigate("/")}>
            Retour à l'accueil
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/products")}
          >
            Voir la collection
          </button>
        </div>
      </div>

      <style>{`
        .notfound-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream, #ebe7e1);
          overflow: hidden;
          margin-top: -80px;
        }

        .notfound-bg-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(215, 189, 136, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(16, 33, 75, 0.04) 0%, transparent 50%);
          pointer-events: none;
        }

        .notfound-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .notfound-page[data-loaded="true"] .notfound-content {
          opacity: 1;
          transform: translateY(0);
        }

        /* Bottle icon */
        .notfound-icon {
          margin-bottom: 2rem;
        }

        .bottle-svg {
          width: 60px;
          height: auto;
          color: var(--gold, #d7bd88);
          opacity: 0.5;
          animation: bottleFloat 6s ease-in-out infinite;
        }

        @keyframes bottleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Label */
        .notfound-label {
          font-family: var(--font-body, 'Lato', sans-serif);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--gold, #d7bd88);
          margin-bottom: 1rem;
        }

        /* Title 404 */
        .notfound-title {
          font-family: var(--font-display, 'Playfair Display', serif);
          font-size: clamp(6rem, 15vw, 12rem);
          font-weight: 300;
          line-height: 1;
          color: var(--navy, #10214b);
          margin: 0 0 1.5rem;
          letter-spacing: -0.02em;
        }

        .notfound-title em {
          font-style: italic;
          color: var(--gold, #d7bd88);
        }

        /* Divider */
        .notfound-divider {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .notfound-divider-line {
          width: 60px;
          height: 1px;
          background: var(--gold, #d7bd88);
          opacity: 0;
          transform: scaleX(0);
          transition: opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s;
        }

        .notfound-page[data-loaded="true"] .notfound-divider-line {
          opacity: 1;
          transform: scaleX(1);
        }

        /* Text */
        .notfound-text {
          font-family: var(--font-body, 'Lato', sans-serif);
          font-size: 0.92rem;
          line-height: 1.9;
          color: var(--text-muted, #8a8580);
          max-width: 380px;
          margin: 0 auto 2.5rem;
        }

        /* Actions */
        .notfound-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .notfound-content {
            padding: 2rem 1.5rem;
          }

          .notfound-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}