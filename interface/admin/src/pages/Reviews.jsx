import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const PAGE_SIZE = 20;

export default function Reviews() {
  const [comments, setComments] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [detail, setDetail]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      // Endpoint admin défini dans review-service : GET /reviews/ → AdminListReviews
      const { data } = await api.get('/reviews/reviews/', { params });
      const list = Array.isArray(data) ? data : data.results ?? data.comments ?? [];
      setComments(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement des commentaires.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleDelete = async (comment) => {
    setDeleting(comment.id);
    try {
      // DELETE /:product_id/comments/delete/:id/
      await api.delete(`/reviews/${comment.product_id}/comments/delete/${comment.id}/`);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch {
      setError('Suppression impossible.');
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Avis clients</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Modération des commentaires</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{total} commentaires</span>
        </div>

        <div style={{ padding: '1.15rem 1.6rem 0' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" placeholder="Rechercher un commentaire…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                  <tr><th>ID</th><th>Produit</th><th>Auteur</th><th>Commentaire</th><th>Créé le</th><th>Modifié le</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {comments.length === 0 ? (
                    <tr><td colSpan={7} className="td-empty">Aucun commentaire disponible.</td></tr>
                  ) : comments.map((c) => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>#{c.id}</td>
                      <td style={{ fontSize: '0.72rem' }}>#{c.product_id}</td>
                      <td style={{ fontSize: '0.72rem' }}>{c.user_email ?? `User #${c.user_id}` ?? '—'}</td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        {c.content ?? '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setDetail(c)}>Voir</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(c)}
                            disabled={deleting === c.id}
                          >
                            {deleting === c.id ? '…' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page} / {totalPages} — {total} commentaires</span>
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

      {/* Detail modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Commentaire #{detail.id}</span>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-key">ID</div><div className="detail-val">{detail.id}</div></div>
                <div className="detail-item"><div className="detail-key">Produit</div><div className="detail-val">#{detail.product_id}</div></div>
                <div className="detail-item"><div className="detail-key">Auteur (email)</div><div className="detail-val">{detail.user_email ?? '—'}</div></div>
                <div className="detail-item"><div className="detail-key">User ID</div><div className="detail-val">{detail.user_id ?? '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Créé le</div><div className="detail-val">{detail.created_at ? new Date(detail.created_at).toLocaleString('fr-FR') : '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Modifié le</div><div className="detail-val">{detail.updated_at ? new Date(detail.updated_at).toLocaleString('fr-FR') : '—'}</div></div>
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--cream)', borderLeft: '2px solid rgba(215,189,136,0.35)' }}>
                <div className="detail-key" style={{ marginBottom: '0.5rem' }}>Contenu</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6 }}>
                  {detail.content ?? '—'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
