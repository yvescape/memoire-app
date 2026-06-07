import { useState } from "react";
import "../styles/contact.css";
import Footer from "../components/footer";

export default function Contact({ navigate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    error: false,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: true,
        success: false,
        error: true,
        message: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    if (!formData.email.includes("@")) {
      setFormStatus({
        submitted: true,
        success: false,
        error: true,
        message: "Veuillez entrer une adresse email valide.",
      });
      return;
    }

    // Simulation d'envoi réussi
    setFormStatus({
      submitted: true,
      success: true,
      error: false,
      message: "Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.",
    });

    // Réinitialiser le formulaire
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    // Cacher le message après 5 secondes
    setTimeout(() => {
      setFormStatus(prev => ({ ...prev, submitted: false }));
    }, 5000);
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <div className="contact-hero">
        <img
          src="https://images.unsplash.com/photo-1588514912908-8f5891714f8d?w=1600&q=80"
          alt="Contact"
          className="contact-hero-img"
        />
        <div className="contact-hero-overlay" />
        <div className="contact-hero-content">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Maison Parfum
          </p>
          <h1>
            <em>Contactez</em> nous
          </h1>
          <div className="divider" />
          <p>Une question ? Une envie particulière ? Notre équipe est à votre écoute.</p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="contact-info-cards">
        <div className="contact-card">
          <div className="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M22 16.92v3a1.999 1.999 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h3 className="contact-card-title">Téléphone</h3>
          <p className="contact-card-text">+33 (0)1 23 45 67 89</p>
          <p className="contact-card-note">Lun-Ven, 9h-18h</p>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3 className="contact-card-title">Email</h3>
          <p className="contact-card-text">contact@maisonparfum.fr</p>
          <p className="contact-card-note">Réponse sous 24h</p>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="contact-card-title">Boutique</h3>
          <p className="contact-card-text">24 Rue du Faubourg Saint-Honoré</p>
          <p className="contact-card-note">75008 Paris, France</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-main">
        <div className="contact-grid">
          {/* Left Column - Contact Form */}
          <div className="contact-form-section">
            <div className="contact-form-header">
              <p className="section-label">Écrivez-nous</p>
              <h2 className="contact-form-title">
                Envoyez-nous un <em>message</em>
              </h2>
              <p className="contact-form-sub">
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
              </p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nom complet *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className={formStatus.error && !formData.name ? "error" : ""}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className={formStatus.error && (!formData.email || !formData.email.includes("@")) ? "error" : ""}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Sujet</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Objet de votre message"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Votre message..."
                  rows="6"
                  className={formStatus.error && !formData.message ? "error" : ""}
                />
              </div>

              {formStatus.submitted && (
                <div className={`form-message ${formStatus.success ? "success" : "error"}`}>
                  {formStatus.success ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {formStatus.message}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {formStatus.message}
                    </>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-gold contact-submit-btn">
                <span>Envoyer le message</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right Column - FAQ / Hours */}
          <div className="contact-faq-section">
            <div className="contact-faq-card">
              <h3 className="faq-title">Questions fréquentes</h3>
              
              <div className="faq-item">
                <h4 className="faq-question">
                  <span className="faq-icon">?</span>
                  Quels sont les délais de livraison ?
                </h4>
                <p className="faq-answer">
                  Les commandes sont expédiées sous 24-48h. Livraison express possible (2-3 jours ouvrés) ou standard (4-6 jours).
                </p>
              </div>

              <div className="faq-item">
                <h4 className="faq-question">
                  <span className="faq-icon">?</span>
                  Puis-je retourner un parfum ?
                </h4>
                <p className="faq-answer">
                  Oui, vous disposez de 30 jours pour retourner votre commande. Le produit doit être neuf et dans son emballage d'origine.
                </p>
              </div>

              <div className="faq-item">
                <h4 className="faq-question">
                  <span className="faq-icon">?</span>
                  Proposez-vous des échantillons ?
                </h4>
                <p className="faq-answer">
                  Oui, 3 échantillons au choix sont offerts pour toute commande. Vous pouvez les sélectionner dans votre panier.
                </p>
              </div>
            </div>

            <div className="contact-hours-card">
              <h3 className="hours-title">Horaires d'ouverture</h3>
              
              <div className="hours-item">
                <span className="hours-day">Lundi - Vendredi</span>
                <span className="hours-time">9h00 - 18h00</span>
              </div>
              
              <div className="hours-item">
                <span className="hours-day">Samedi</span>
                <span className="hours-time">10h00 - 17h00</span>
              </div>
              
              <div className="hours-item">
                <span className="hours-day">Dimanche</span>
                <span className="hours-time closed">Fermé</span>
              </div>

              <p className="hours-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Notre équipe vous répond sous 24h
              </p>
            </div>

            <div className="contact-social">
              <h4 className="social-title">Suivez-nous</h4>
              <div className="social-icons">
                <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="contact-map-section">
        <div className="map-container">
          <iframe
            title="Boutique Paris"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.991440608208!2d2.319292715674367!3d48.86860207928778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66fc50dc75ccf%3A0x42f0f4fa01438416!2sFranklin%20D.%20Roosevelt!5e0!3m2!1sfr!2sfr!4v1620000000000!5m2!1sfr!2sfr"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          />
        </div>
        <div className="map-overlay">
          <div className="map-address">
            <h4>Notre boutique</h4>
            <p>24 Rue du Faubourg Saint-Honoré</p>
            <p>75008 Paris</p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline map-btn"
            >
              Obtenir l'itinéraire
            </a>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}