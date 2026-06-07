import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const PAGE_SIZE = 20;

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toggling, setToggling] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const { data } = await api.get('/users/list/', { params });
      const list = Array.isArray(data) ? data : data.results ?? data.users ?? [];
      setUsers(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id, current) => {
    setToggling(id);
    try {
      await api.patch(`/users/${id}/toggle/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !current } : u))
      );
    } catch {
      setError('Impossible de modifier le statut.');
    } finally {
      setToggling(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const roleLabel = (u) => {
    if (u.is_staff) return <span className="badge badge-info">Admin</span>;
    return <span className="badge badge-active">Client</span>;
  };

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Utilisateurs</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Comptes utilisateurs</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{total} au total</span>
        </div>

        <div style={{ padding: '1.15rem 1.6rem 0' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                placeholder="Rechercher par email ou username…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /><span className="loading-text">Chargement</span></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Email</th><th>Username</th><th>Nom</th><th>Rôle</th><th>Email vérifié</th><th>Inscription</th><th>Actif</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={8} className="td-empty">Aucun utilisateur trouvé.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>#{u.id}</td>
                      <td style={{ fontSize: '0.75rem' }}>{u.email}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.username ?? '—'}</td>
                      <td>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                      <td>{roleLabel(u)}</td>
                      <td>
                        {u.is_email_verified
                          ? <span className="badge badge-success">Vérifié</span>
                          : <span className="badge badge-inactive">Non vérifié</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                        <label className="toggle" title={u.is_active ? 'Désactiver' : 'Activer'}>
                          <input
                            type="checkbox"
                            checked={!!u.is_active}
                            disabled={toggling === u.id}
                            onChange={() => handleToggle(u.id, u.is_active)}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {page} sur {totalPages} — {total} résultats
                </span>
                <div className="pagination-btns">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return n <= totalPages ? (
                      <button key={n} className={`page-btn${page === n ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                    ) : null;
                  })}
                  <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
