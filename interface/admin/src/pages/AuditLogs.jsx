import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const PAGE_SIZE = 30;

// Actions définies dans le backend : CREATE | UPDATE | DELETE | LOGIN
const ACTION_BADGE = {
  CREATE: 'badge-success',
  UPDATE: 'badge-warning',
  DELETE: 'badge-danger',
  LOGIN:  'badge-info',
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const { data } = await api.get('/users/audit-logs/', { params });
      const list = Array.isArray(data) ? data : data.results ?? data.logs ?? [];
      setLogs(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actionBadge = (action = '') => {
    const key = action.toUpperCase();
    return (
      <span className={`badge ${ACTION_BADGE[key] ?? 'badge-active'}`}>
        {action || '—'}
      </span>
    );
  };

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Journaux d'audit</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Historique des actions</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{total} entrées</span>
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
                placeholder="Filtrer par utilisateur ou action…"
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
                    <th>Date</th><th>User ID</th><th>Action</th><th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} className="td-empty">Aucun journal disponible.</td></tr>
                  ) : logs.map((log, i) => (
                    <tr key={log.id ?? i}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {(log.timestamp ?? log.created_at)
                          ? new Date(log.timestamp ?? log.created_at).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {log.user_id ? `#${log.user_id}` : '—'}
                      </td>
                      <td>{actionBadge(log.action)}</td>
                      <td style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.ip_address ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page} / {totalPages} — {total} entrées</span>
                <div className="pagination-btns">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
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
