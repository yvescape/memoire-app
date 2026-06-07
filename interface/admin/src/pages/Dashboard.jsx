import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/users/list/'),
      api.get('/products/'),
      api.get('/orders/my/'),
      api.get('/payments/list/'),
    ]).then(([users, products, orders, payments]) => {
      setStats({
        users:    users.value?.data?.count    ?? users.value?.data?.length    ?? '—',
        products: products.value?.data?.count ?? products.value?.data?.length ?? '—',
        orders:   orders.value?.data?.count   ?? orders.value?.data?.length   ?? '—',
        payments: payments.value?.data?.count ?? payments.value?.data?.length ?? '—',
      });
      setLoading(false);
    });
  }, []);

  const CARDS = [
    { label: 'Utilisateurs',  key: 'users',    meta: 'Comptes enregistrés' },
    { label: 'Produits',      key: 'products', meta: 'Références actives' },
    { label: 'Commandes',     key: 'orders',   meta: 'Total traité' },
    { label: 'Paiements',     key: 'payments', meta: 'Transactions' },
  ];

  const LINKS = [
    { label: 'Gérer les utilisateurs',  href: '/admin/users',      desc: 'Activer / désactiver des comptes' },
    { label: 'Journaux d\'audit',       href: '/admin/audit-logs', desc: 'Historique des actions' },
    { label: 'Catalogue produits',      href: '/admin/products',   desc: 'Créer, modifier, supprimer' },
    { label: 'Suivi des commandes',     href: '/admin/orders',     desc: 'Confirmer ou annuler' },
    { label: 'Transactions',            href: '/admin/payments',   desc: 'Consulter les paiements' },
    { label: 'Avis clients',            href: '/admin/reviews',    desc: 'Modérer les commentaires' },
    { label: 'Options de livraison',    href: '/admin/delivery',   desc: 'Tarifs et délais' },
  ];

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Tableau de bord</span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span className="loading-text">Chargement</span>
        </div>
      ) : (
        <div className="stats-grid">
          {CARDS.map(({ label, key, meta }) => (
            <div className="stat-card" key={key}>
              <div className="stat-accent" />
              <div className="stat-label">{label}</div>
              <div className="stat-value">{stats?.[key] ?? '—'}</div>
              <div className="stat-meta">{meta}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick access */}
      <div className="card" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <span className="card-title">Accès rapide</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', background: 'rgba(215,189,136,0.1)' }}>
          {LINKS.map(({ label, href, desc }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '1.25rem 1.5rem',
                background: 'var(--white)',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cream)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--white)')}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 400, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{desc}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
