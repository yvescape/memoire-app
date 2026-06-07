import "../styles/legal.css";
import Footer from "../components/footer";

export default function Legal({ navigate }) {
  return (
    <div className="legal-page">
      {/* Hero */}
      <div className="legal-hero">
        <img
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80"
          alt="Mentions légales"
          className="legal-hero-img"
        />
        <div className="legal-hero-overlay" />
        <div className="legal-hero-content">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Informations
          </p>
          <h1>
            Mentions <em>légales</em>
          </h1>
          <div className="divider" />
          <p>Informations légales et conditions d'utilisation du site</p>
        </div>
      </div>

      {/* Content */}
      <div className="legal-content">
        <div className="legal-container">
          {/* Éditeur */}
          <section className="legal-section">
            <h2 className="legal-section-title">Éditeur du site</h2>
            <div className="legal-card">
              <p><strong>Maison Parfum SAS</strong></p>
              <p>Société par Actions Simplifiée au capital de 150 000 €</p>
              <p>RCS Paris B 412 345 678</p>
              <p>TVA intracommunautaire : FR 12 412345678</p>
              <p className="legal-space"></p>
              <p>24 Rue du Faubourg Saint-Honoré</p>
              <p>75008 Paris</p>
              <p>France</p>
              <p className="legal-space"></p>
              <p>Téléphone : +33 (0)1 23 45 67 89</p>
              <p>Email : contact@maisonparfum.fr</p>
            </div>
          </section>

          {/* Directeur */}
          <section className="legal-section">
            <h2 className="legal-section-title">Directeur de la publication</h2>
            <div className="legal-card">
              <p><strong>Isabelle Moreau</strong></p>
              <p>Présidente Directrice Générale</p>
              <p>Email : direction@maisonparfum.fr</p>
            </div>
          </section>

          {/* Hébergement */}
          <section className="legal-section">
            <h2 className="legal-section-title">Hébergement</h2>
            <div className="legal-card">
              <p><strong>Vercel Inc.</strong></p>
              <p>340 S Lemon Ave #4133</p>
              <p>Walnut, CA 91789</p>
              <p>États-Unis</p>
              <p className="legal-space"></p>
              <p>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">https://vercel.com</a></p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="legal-section">
            <h2 className="legal-section-title">Propriété intellectuelle</h2>
            <div className="legal-card">
              <p>L'ensemble du contenu du site <strong>maisonparfum.fr</strong> (textes, images, vidéos, logos, marques, etc.) est la propriété exclusive de Maison Parfum SAS ou de ses partenaires. Toute reproduction, représentation, modification ou exploitation, même partielle, est interdite sans autorisation préalable écrite.</p>
              <p className="legal-space"></p>
              <p>Les marques et noms de parfums (Lumière Dorée, Nuit Profonde, Aurore Blanche, etc.) sont des marques déposées par Maison Parfum SAS.</p>
            </div>
          </section>

          {/* Données personnelles */}
          <section className="legal-section">
            <h2 className="legal-section-title">Données personnelles</h2>
            <div className="legal-card">
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>
              <p className="legal-space"></p>
              <p>Pour exercer ces droits, contactez-nous à : <strong>rgpd@maisonparfum.fr</strong></p>
              <p className="legal-space"></p>
              <p>Vos données sont collectées uniquement pour le traitement de vos commandes et l'envoi de notre newsletter (avec votre consentement). Elles ne sont jamais transmises à des tiers.</p>
            </div>
          </section>

          {/* Cookies */}
          <section className="legal-section">
            <h2 className="legal-section-title">Gestion des cookies</h2>
            <div className="legal-card">
              <p>Notre site utilise des cookies pour améliorer votre expérience de navigation et analyser le trafic.</p>
              <p className="legal-space"></p>
              <p><strong>Types de cookies utilisés :</strong></p>
              <ul className="legal-list">
                <li>Cookies techniques (nécessaires au fonctionnement du site)</li>
                <li>Cookies analytiques (mesure d'audience, anonymisés)</li>
                <li>Cookies de session (conservation du panier)</li>
              </ul>
              <p className="legal-space"></p>
              <p>Vous pouvez à tout moment paramétrer vos préférences via le bandeau cookies ou les paramètres de votre navigateur.</p>
            </div>
          </section>

          {/* Conditions de vente */}
          <section className="legal-section">
            <h2 className="legal-section-title">Conditions générales de vente</h2>
            <div className="legal-card">
              <p>Nos conditions générales de vente sont disponibles <span className="legal-link" onClick={() => navigate("cgv")}>en cliquant ici</span>.</p>
              <p className="legal-space"></p>
              <p><strong>Prix :</strong> Tous nos prix sont indiqués en euros TTC (TVA française incluse). Les frais de livraison sont offerts en France métropolitaine à partir de 120€ d'achat.</p>
              <p><strong>Paiement :</strong> Carte bancaire (Visa, Mastercard, American Express) et PayPal.</p>
              <p><strong>Livraison :</strong> Colissimo suivi (2-5 jours) ou Chronopost (24-48h).</p>
            </div>
          </section>

          {/* Médiation */}
          <section className="legal-section">
            <h2 className="legal-section-title">Médiation</h2>
            <div className="legal-card">
              <p>Conformément aux articles L.616-1 et R.616-1 du code de la consommation, nous proposons un dispositif de médiation conventionnelle.</p>
              <p className="legal-space"></p>
              <p><strong>Médiateur de la consommation :</strong></p>
              <p>CM2C - Centre de la Médiation de la Consommation</p>
              <p>14 Rue Saint-Jean, 75017 Paris</p>
              <p><a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer">https://www.cm2c.net</a></p>
            </div>
          </section>

          {/* Dernière mise à jour */}
          <div className="legal-update">
            <p>Dernière mise à jour : 24 février 2025</p>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}