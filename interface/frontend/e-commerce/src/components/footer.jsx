import "../styles/footer.css";
import ElyseeLogo from "./logo";
import { Link } from "react-router-dom";

export default function Footer({ navigate }) {
  const handleNavigation = (page) => {
    if (navigate) {
      navigate(page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <p className="section-label">Restez informé</p>
          <h2 className="newsletter-title">
            L'actualité de <em>la maison</em>
          </h2>
          <p className="newsletter-sub">
            Nouveautés, événements exclusifs et offres réservées à nos membres.
          </p>
          <form className="newsletter-form">
            <input type="email" placeholder="Votre adresse e-mail" />
            <button className="btn-navy">S'abonner</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">
          <ElyseeLogo 
            onClick={() => handleNavigation("home")} 
            variant="light" 
          />
        </div>
        <div className="footer-links">
          <Link to="/about">À propos</Link>
          <Link to="/products">Collection</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/legal">Mentions légales</Link>
        </div>
        <p className="footer-copy">© 2025 Maison Parfum. Tous droits réservés.</p>
      </footer>
    </>
  );
}