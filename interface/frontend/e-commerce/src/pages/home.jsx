import { useState, useEffect, useRef } from "react";
import "../styles/home.css";
import ElyseeLogo from "../components/logo";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Home() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState({});
  const [featured, setFeatured] = useState([]);
  const refs = useRef({});

  // Charger 3 produits depuis l'API
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/products/");
        setFeatured(data.results.slice(0, 3));
      } catch (err) {
        console.error("Erreur chargement produits:", err);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((prev) => ({ ...prev, [e.target.dataset.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );

    Object.values(refs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [featured]);

  const setRef = (id) => (el) => {
    refs.current[id] = el;
  };

  const formatPrice = (price) => {
    return Math.round(parseFloat(price)).toLocaleString("fr-FR");
  };

  // Résumé des notes depuis les champs API
  const getNotes = (p) => {
    return [p.notes_top, p.notes_heart, p.notes_base]
      .filter(Boolean)
      .map((n) => n.split(", ")[0])
      .join(" · ");
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1600&q=80"
            alt="Hero"
            className="hero-img"
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <p className="hero-pre">Maison de parfumerie</p>
          <h1 className="hero-title">
            L'Art du
            <br />
            <em>Parfum</em>
          </h1>
          <div className="divider-left" style={{ marginLeft: "2px" }}>
            <div className="divider" style={{ margin: 0 }} />
          </div>
          <p className="hero-sub">
            Des fragrances d'exception, façonnées avec soin
            <br />
            pour révéler votre essence.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold" onClick={() => navigate("/products")}>
              Découvrir la collection
            </button>
            <button
              className="btn btn-outline"
              style={{ color: "var(--cream)", borderColor: "var(--cream)" }}
              onClick={() => navigate("/about")}
            >
              Notre histoire
            </button>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Défiler</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Intro */}
      <section
        className={`intro-section ${visible["intro"] ? "in-view" : ""}`}
        ref={setRef("intro")}
        data-id="intro"
      >
        <div className="intro-inner">
          <p className="section-label">Notre philosophie</p>
          <h2 className="intro-heading">
            Chaque flacon raconte
            <br />
            <em>une histoire unique</em>
          </h2>
          <div className="divider" />
          <p className="intro-text">
            Créées par des maîtres parfumeurs, nos compositions allient tradition
            et modernité, sélectionnant les matières premières les plus rares aux
            quatre coins du monde.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="featured-section">
        <div className="featured-header">
          <p className="section-label">Bestsellers</p>
          <h2 className="section-title">
            Nos <em>incontournables</em>
          </h2>
        </div>
        <div className="featured-grid">
          {featured.map((p, i) => (
            <div
              key={p.id}
              className={`featured-card ${visible[`card-${p.id}`] ? "in-view" : ""}`}
              ref={setRef(`card-${p.id}`)}
              data-id={`card-${p.id}`}
              style={{ animationDelay: `${i * 0.15}s` }}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="card-image-wrap">
                <img src={p.image} alt={p.name} className="card-image" />
                <div className="card-overlay">
                  <button className="btn btn-gold" style={{ padding: "0.8rem 2rem" }}>
                    Découvrir
                  </button>
                </div>
              </div>
              <div className="card-info">
                <p className="card-category">{p.category}</p>
                <h3 className="card-name">{p.name}</h3>
                <p className="card-notes">{p.notes || getNotes(p)}</p>
                <p className="card-price">{formatPrice(p.price)} FCFA</p>
              </div>
            </div>
          ))}
        </div>
        <div className="featured-cta">
          <button className="btn btn-outline" onClick={() => navigate("/products")}>
            Voir toute la collection
          </button>
        </div>
      </section>

      {/* Banner */}
      <section
        className={`banner-section ${visible["banner"] ? "in-view" : ""}`}
        ref={setRef("banner")}
        data-id="banner"
      >
        <div className="banner-inner">
          <img
            src="https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200&q=80"
            alt="Artisanat"
            className="banner-img"
          />
          <div className="banner-content">
            <p className="section-label" style={{ color: "var(--gold)" }}>
              Savoir-faire
            </p>
            <h2 className="banner-title">
              L'excellence
              <br />
              à chaque détail
            </h2>
            <div className="divider" style={{ margin: "1.5rem 0" }} />
            <p className="banner-text">
              Depuis 1998, nous créons des parfums d'exception avec des ingrédients
              sourcés de manière éthique et durable.
            </p>
            <button className="btn btn-gold" style={{ marginTop: "2rem" }} onClick={() => navigate("/about")}>
              Notre atelier
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className={`testimonials-section ${visible["testi"] ? "in-view" : ""}`}
        ref={setRef("testi")}
        data-id="testi"
      >
        <p className="section-label">Témoignages</p>
        <h2 className="section-title" style={{ marginBottom: "3rem" }}>
          Ils nous font <em>confiance</em>
        </h2>
        <div className="testi-grid">
          {[
            {
              quote:
                "Un parfum qui transcende toutes mes attentes. Lumière Dorée est devenu ma signature olfactive.",
              author: "Marie L.",
              location: "Paris",
            },
            {
              quote:
                "La qualité des matières premières est perceptible dès le premier instant. Une maison d'exception.",
              author: "Thomas R.",
              location: "Lyon",
            },
            {
              quote:
                "Nuit Profonde m'accompagne depuis 3 ans. Un voyage olfactif sans pareil.",
              author: "Sophie M.",
              location: "Bordeaux",
            },
          ].map((t, i) => (
            <div key={i} className="testi-card">
              <div className="testi-quote">"</div>
              <p className="testi-text">{t.quote}</p>
              <div className="testi-author">
                <strong>{t.author}</strong>
                <span>{t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}