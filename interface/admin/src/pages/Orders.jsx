import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const PAGE_SIZE = 20;

// Statuts définis dans le backend : pending | confirmed | cancelled
const STATUS_BADGE = {
  pending:   'badge-pending',
  confirmed: 'badge-success',
  cancelled: 'badge-danger',
};

const STATUS_LABEL = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

export default function Orders() {
  const [orders, setOrders]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [acting, setActing]     = useState(false);
  const [detail, setDetail]     = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (filter !== 'all') params.status = filter;
      const { data } = await api.get('/orders/my/', { params });
      const list = Array.isArray(data) ? data : data.results ?? data.orders ?? [];
      setOrders(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleConfirm = async () => {
    setActing(true);
    try {
      await api.patch(`/orders/${selected.id}/confirm/`);
      setOrders((prev) => prev.map((o) => o.id === selected.id ? { ...o, status: 'confirmed' } : o));
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la confirmation.');
      setModal(null);
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    try {
      await api.patch(`/orders/${selected.id}/cancel/`);
      setOrders((prev) => prev.map((o) => o.id === selected.id ? { ...o, status: 'cancelled' } : o));
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'annulation.');
      setModal(null);
    } finally {
      setActing(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Helpers pour naviguer dans les objets imbriqués du modèle Order
  const getTotal    = (o) => o.pricing?.total ?? null;
  const getCurrency = (o) => o.pricing?.currency ?? 'FCFA';
  const getDelivery = (o) => o.pricing?.delivery_option?.name ?? '—';
  const getClient   = (o) => o.address?.email ?? (o.user_id ? `User #${o.user_id}` : o.session_id?.slice(0, 8) ?? '—');

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Commandes</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Gestion des commandes</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{total} commandes</span>
        </div>

        <div style={{ padding: '1.15rem 1.6rem 0' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="toolbar">
            <div className="filter-wrap">
              <select className="filter-select" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="cancelled">Annulées</option>
              </select>
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
                  <tr><th>ID</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th><th>Livraison</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="td-empty">Aucune commande.</td></tr>
                  ) : orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>#{o.id}</td>
                      <td style={{ fontSize: '0.75rem' }}>{getClient(o)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                        {getTotal(o) != null
                          ? `${Number(getTotal(o)).toLocaleString('fr-FR')} ${getCurrency(o)}`
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-active'}`}>
                          {STATUS_LABEL[o.status] ?? o.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{getDelivery(o)}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setDetail(o)}>Détail</button>
                          {o.status === 'pending' && (
                            <>
                              <button className="btn btn-gold btn-sm" onClick={() => { setSelected(o); setModal('confirm'); }}>Confirmer</button>
                              <button className="btn btn-danger btn-sm" onClick={() => { setSelected(o); setModal('cancel'); }}>Annuler</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page} / {totalPages} — {total} commandes</span>
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Commande #{detail.id}</span>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Adresse */}
              {detail.address && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="detail-key" style={{ marginBottom: '0.4rem' }}>Adresse de livraison</div>
                  <div className="detail-grid">
                    <div className="detail-item"><div className="detail-key">Nom</div><div className="detail-val">{[detail.address.first_name, detail.address.last_name].filter(Boolean).join(' ') || '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Email</div><div className="detail-val">{detail.address.email ?? '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Mobile</div><div className="detail-val">{detail.address.mobile ?? '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Ville</div><div className="detail-val">{detail.address.city ?? '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Adresse</div><div className="detail-val">{detail.address.address_line ?? '—'}</div></div>
                  </div>
                </div>
              )}
              {/* Tarification */}
              {detail.pricing && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="detail-key" style={{ marginBottom: '0.4rem' }}>Tarification</div>
                  <div className="detail-grid">
                    <div className="detail-item"><div className="detail-key">Sous-total</div><div className="detail-val">{detail.pricing.subtotal != null ? `${Number(detail.pricing.subtotal).toLocaleString('fr-FR')} ${detail.pricing.currency}` : '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Livraison</div><div className="detail-val">{detail.pricing.delivery_price != null ? `${Number(detail.pricing.delivery_price).toLocaleString('fr-FR')} ${detail.pricing.currency}` : '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Total</div><div className="detail-val" style={{ fontWeight: 600 }}>{detail.pricing.total != null ? `${Number(detail.pricing.total).toLocaleString('fr-FR')} ${detail.pricing.currency}` : '—'}</div></div>
                    <div className="detail-item"><div className="detail-key">Option livraison</div><div className="detail-val">{detail.pricing.delivery_option?.name ?? '—'}</div></div>
                  </div>
                </div>
              )}
              {/* Articles */}
              {detail.items?.length > 0 && (
                <div>
                  <div className="detail-key" style={{ marginBottom: '0.4rem' }}>Articles ({detail.items.length})</div>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Produit</th>
                        <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Taille</th>
                        <th style={{ textAlign: 'right', padding: '0.3rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Qté</th>
                        <th style={{ textAlign: 'right', padding: '0.3rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.3rem 0.5rem' }}>{item.product_name ?? `#${item.product_id}`}</td>
                          <td style={{ padding: '0.3rem 0.5rem', color: 'var(--text-muted)' }}>{item.product_size ?? '—'}</td>
                          <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                          <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 500 }}>{item.total != null ? Number(item.total).toLocaleString('fr-FR') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {modal === 'confirm' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirmer la commande</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6 }}>
                Confirmer la commande <strong>#{selected?.id}</strong> ?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-gold" onClick={handleConfirm} disabled={acting}>
                {acting ? 'En cours…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {modal === 'cancel' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Annuler la commande</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6 }}>
                Annuler définitivement la commande <strong>#{selected?.id}</strong> ?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Fermer</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={acting}>
                {acting ? 'En cours…' : 'Annuler la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
