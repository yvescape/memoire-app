import { useState, useEffect, useRef } from "react";
import "../styles/about.css";
import Footer from "../components/footer";

export default function About({ navigate }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [visible, setVisible] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((prev) => ({ ...prev, [e.target.dataset.id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );

    Object.values(refs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id) => (el) => {
    refs.current[id] = el;
  };

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const valeurs = [
    {
      title: "Excellence",
      icon: "✦",
      desc: "Nous sélectionnons les meilleures matières premières aux quatre coins du monde pour créer des fragrances d'exception."
    },
    {
      title: "Authenticité",
      icon: "◈",
      desc: "Chaque parfum raconte une histoire unique, façonnée avec passion et respect des traditions françaises."
    },
    {
      title: "Durabilité",
      icon: "◉",
      desc: "Notre engagement pour une parfumerie responsable, avec des ingrédients sourcés de manière éthique et durable."
    }
  ];

  const equipe = [
    {
      name: "Isabelle Moreau",
      role: "Fondatrice & Maître Parfumeur",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      desc: "Formée à Grasse, Isabelle a travaillé pendant 20 ans chez les plus grandes maisons avant de fonder la sienne."
    },
    {
      name: "Jean-Baptiste Delacroix",
      role: "Directeur Artistique",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
      desc: "Jean-Baptiste imagine les flacons et l'univers visuel de chaque collection, alliant modernité et élégance."
    },
    {
      name: "Claire Beaumont",
      role: "Responsable Création",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
      desc: "Claire explore les nouvelles tendances olfactives et travaille main dans la main avec les laboratoires."
    }
  ];

  const timeline = [
    { year: "1998", event: "Fondation de la Maison Parfum à Paris" },
    { year: "2005", event: "Première boutique au Faubourg Saint-Honoré" },
    { year: "2012", event: "Lancement de la collection 'Nuit Profonde'" },
    { year: "2018", event: "Certification Bio Équitable pour nos ingrédients" },
    { year: "2024", event: "Ouverture de notre laboratoire de création à Grasse" }
  ];

  return (
    <div className="about-page">
      {/* Hero */}
      <div className="about-hero">
        <img
          src="https://images.unsplash.com/photo-1614339700782-517a41d867ac?w=1600&q=80"
          alt="Notre histoire"
          className="about-hero-img"
        />
        <div className="about-hero-overlay" />
        <div className="about-hero-content">
          <p className="section-label" style={{ color: "var(--gold)" }}>
            Maison Parfum
          </p>
          <h1>
            Notre <em>histoire</em>
          </h1>
          <div className="divider" />
          <p>Depuis 1998, l'excellence française au service de la parfumerie</p>
        </div>
      </div>

      {/* Story Section */}
      <section 
        className={`story-section ${visible["story"] ? "in-view" : ""}`}
        ref={setRef("story")}
        data-id="story"
      >
        <div className="story-grid">
          <div className="story-content">
            <p className="section-label">Notre histoire</p>
            <h2 className="story-title">
              L'élégance <em>à la française</em>
            </h2>
            <div className="divider-left" />
            <p className="story-text">
              Fondée en 1998 par Isabelle Moreau, Maison Parfum est née d'une passion transmise de génération en génération. 
              Après avoir travaillé pendant vingt ans auprès des plus grands nez de Grasse, Isabelle décide de créer sa propre 
              maison pour exprimer sa vision unique de la parfumerie.
            </p>
            <p className="story-text">
              Aujourd'hui, notre équipe de maîtres parfumeurs perpétue cet héritage, sélectionnant les meilleures matières 
              premières à travers le monde pour créer des fragrances intemporelles, authentiques et résolument modernes.
            </p>
            <div className="story-signature">
              <span>Isabelle Moreau</span>
              <span className="signature-line"></span>
              <span>Fondatrice</span>
            </div>
          </div>
          <div className="story-image-wrap">
            <img 
              src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80" 
              alt="Notre atelier"
              className="story-image"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-header">
          <p className="section-label">Notre philosophie</p>
          <h2 className="values-title">
            Des valeurs qui nous <em>animent</em>
          </h2>
        </div>
        <div className="values-grid">
          {valeurs.map((v, i) => (
            <div 
              key={i}
              className={`value-card ${visible[`value-${i}`] ? "in-view" : ""}`}
              ref={setRef(`value-${i}`)}
              data-id={`value-${i}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="value-icon">{v.icon}</div>
              <h3 className="value-title">{v.title}</h3>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section">
        <div className="timeline-header">
          <p className="section-label">Notre parcours</p>
          <h2 className="timeline-title">
            Une histoire en <em>perpétuelle évolution</em>
          </h2>
        </div>
        <div className="timeline">
          {timeline.map((item, i) => (
            <div 
              key={i}
              className={`timeline-item ${visible[`timeline-${i}`] ? "in-view" : ""}`}
              ref={setRef(`timeline-${i}`)}
              data-id={`timeline-${i}`}
            >
              <div className="timeline-year">{item.year}</div>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <p>{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-header">
          <p className="section-label">Notre équipe</p>
          <h2 className="team-title">
            Les talents derrière <em>les fragrances</em>
          </h2>
        </div>
        <div className="team-grid">
          {equipe.map((m, i) => (
            <div 
              key={i}
              className={`team-card ${visible[`team-${i}`] ? "in-view" : ""}`}
              ref={setRef(`team-${i}`)}
              data-id={`team-${i}`}
            >
              <div className="team-image-wrap">
                <img src={m.image} alt={m.name} className="team-image" />
                <div className="team-overlay">
                  <p className="team-desc">{m.desc}</p>
                </div>
              </div>
              <h3 className="team-name">{m.name}</h3>
              <p className="team-role">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="certif-section">
        <div className="certif-inner">
          <div className="certif-content">
            <p className="section-label">Notre engagement</p>
            <h2 className="certif-title">
              Une parfumerie <em>responsable</em>
            </h2>
            <p className="certif-text">
              Nous sommes fiers d'être certifiés Bio Équitable et de travailler main dans la main avec des producteurs locaux 
              qui partagent nos valeurs de respect de l'environnement et des hommes.
            </p>
            <div className="certif-badges">
              <div className="certif-badge">
                <span className="badge-icon">🌿</span>
                <span>Bio Équitable</span>
              </div>
              <div className="certif-badge">
                <span className="badge-icon">♻️</span>
                <span>Emballages recyclés</span>
              </div>
              <div className="certif-badge">
                <span className="badge-icon">🌍</span>
                <span>Commerce équitable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-section">
        <div className="faq-header">
          <p className="section-label">Questions fréquentes</p>
          <h2 className="faq-title">
            Tout ce que vous devez <em>savoir</em>
          </h2>
        </div>
        <div className="faq-container">
          {[
            {
              q: "Où sont fabriqués vos parfums ?",
              a: "Tous nos parfums sont conçus et fabriqués en France, principalement dans notre atelier de Grasse, capitale mondiale du parfum."
            },
            {
              q: "Utilisez-vous des ingrédients naturels ?",
              a: "Oui, nous privilégions les ingrédients naturels et travaillons avec des producteurs locaux pour garantir la qualité et la traçabilité de nos matières premières."
            },
            {
              q: "Proposez-vous des échantillons ?",
              a: "Pour toute commande, nous offrons 3 échantillons de votre choix. Vous pouvez également commander un coffret découverte de 5 parfums."
            },
            {
              q: "Comment conserver mon parfum ?",
              a: "Conservez votre parfum à l'abri de la lumière et de la chaleur, dans son coffret d'origine. Évitez la salle de bain."
            }
          ].map((item, i) => (
            <div 
              key={i}
              className={`faq-item ${visible[`faq-${i}`] ? "in-view" : ""}`}
              ref={setRef(`faq-${i}`)}
              data-id={`faq-${i}`}
            >
              <div 
                className={`faq-question ${activeIndex === i ? "active" : ""}`}
                onClick={() => toggleAccordion(i)}
              >
                <span className="faq-question-text">{item.q}</span>
                <span className="faq-icon">{activeIndex === i ? "−" : "+"}</span>
              </div>
              <div className={`faq-answer ${activeIndex === i ? "active" : ""}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}