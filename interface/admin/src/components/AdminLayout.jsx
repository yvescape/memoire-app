import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../styles/admin.css';

/* ─── Navigation config ─── */
const NAV_GROUPS = [
  {
    section: 'Général',
    items: [
      { to: '/admin', label: 'Tableau de bord', end: true, Icon: IconDash },
    ],
  },
  {
    section: 'Utilisateurs',
    items: [
      { to: '/admin/users',      label: 'Comptes',        Icon: IconUsers },
      { to: '/admin/audit-logs', label: 'Journaux audit', Icon: IconLog },
    ],
  },
  {
    section: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Produits', Icon: IconProduct },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { to: '/admin/orders',   label: 'Commandes', Icon: IconOrder },
      { to: '/admin/payments', label: 'Paiements', Icon: IconPayment },
      { to: '/admin/delivery', label: 'Livraison', Icon: IconTruck },
    ],
  },
  {
    section: 'Contenu',
    items: [
      { to: '/admin/reviews', label: 'Avis clients', Icon: IconStar },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin && !payload.is_staff) { navigate('/'); return; }
      setUser(payload);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const initials = user ? (user.email || user.username || 'AD').slice(0, 2).toUpperCase() : 'AD';
  const displayName = user?.email || user?.username || 'Administrateur';

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-brand">SCENTARA</span>
          <span className="admin-brand-sub">Administration</span>
        </div>

        <nav className="admin-nav">
          {NAV_GROUPS.map(({ section, items }) => (
            <div key={section}>
              <div className="admin-nav-section">{section}</div>
              {items.map(({ to, label, end, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="nav-icon" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-row">
            <div className="admin-avatar">{initials}</div>
            <div>
              <div className="admin-user-name">{displayName}</div>
              <div className="admin-user-role">Admin</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={logout}>
            <IconLogout style={{ width: 12, height: 12, flexShrink: 0 }} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(16,33,75,0.25)' }}
        />
      )}

      {/* ── Main ── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-mobile-toggle"
              style={{ display: 'none' }}
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <IconMenu style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <span className="admin-topbar-date">
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/* ══ Inline SVG icons ══ */
function IconDash({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function IconUsers({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  );
}
function IconLog({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2z"/>
    </svg>
  );
}
function IconProduct({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
function IconOrder({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/>
    </svg>
  );
}
function IconPayment({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
    </svg>
  );
}
function IconTruck({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="1"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  );
}
function IconStar({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
function IconLogout({ style }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function IconMenu({ style }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
