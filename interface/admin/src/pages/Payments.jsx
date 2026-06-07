import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const PAGE_SIZE = 20;

// Statuts définis dans le backend : success | failed
const STATUS_BADGE = {
  success: 'badge-success',
  failed:  'badge-danger',
};

const STATUS_LABEL = {
  success: 'Succès',
  failed:  'Échoué',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [detail, setDetail]     = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/payments/list/', { params: { page, page_size: PAGE_SIZE } });
      const list = Array.isArray(data) ? data : data.results ?? data.payments ?? [];
      setPayments(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Paiements</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Transactions</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{total} transactions</span>
        </div>

        {error && <div style={{ padding: '0 1.6rem' }}><div className="alert alert-error">{error}</div></div>}

        {loading ? (
          <div className="loading"><div className="spinner" /><span className="loading-text">Chargement</span></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Réf. transaction</th><th>Commande</th><th>Pricing ID</th><th>Montant</th><th>Statut</th><th>Date</th><th>Détail</th></tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} className="td-empty">Aucune transaction.</td></tr>
                  ) : payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {p.transaction_reference ?? '—'}
                      </td>
                      <td style={{ fontSize: '0.72rem' }}>{p.order_id ? `#${p.order_id}` : '—'}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.order_pricing_id ?? '—'}</td>
                      <td style={{ fontWeight: 400 }}>
                        {p.amount != null
                          ? `${Number(p.amount).toLocaleString('fr-FR')} ${p.currency ?? 'FCFA'}`
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-active'}`}>
                          {STATUS_LABEL[p.status] ?? p.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetail(p)}>Voir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page} / {totalPages} — {total} paiements</span>
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
              <span className="modal-title">Détail du paiement</span>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-key">ID</div><div className="detail-val">{detail.id}</div></div>
                <div className="detail-item"><div className="detail-key">Réf. transaction</div><div className="detail-val" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{detail.transaction_reference ?? '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Commande</div><div className="detail-val">{detail.order_id ? `#${detail.order_id}` : '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Pricing ID</div><div className="detail-val">{detail.order_pricing_id ?? '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Montant</div><div className="detail-val" style={{ fontWeight: 600 }}>{detail.amount != null ? `${Number(detail.amount).toLocaleString('fr-FR')} ${detail.currency ?? 'FCFA'}` : '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Statut</div><div className="detail-val"><span className={`badge ${STATUS_BADGE[detail.status] ?? 'badge-active'}`}>{STATUS_LABEL[detail.status] ?? detail.status ?? '—'}</span></div></div>
                <div className="detail-item"><div className="detail-key">Date</div><div className="detail-val">{detail.created_at ? new Date(detail.created_at).toLocaleString('fr-FR') : '—'}</div></div>
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
