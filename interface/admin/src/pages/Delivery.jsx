import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const EMPTY_FORM = {
  name: '', description: '', amount: '', currency: 'XOF',
  position: 0, is_active: true, is_default: false,
};

export default function Delivery() {
  const [options, setOptions]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const fetchOptions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/orders/admin/delivery-options/');
      setOptions(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create'); };
  const openEdit   = (o)  => {
    setSelected(o);
    setForm({
      name:        o.name        ?? '',
      description: o.description ?? '',
      amount:      o.amount      ?? '',
      currency:    o.currency    ?? 'XOF',
      position:    o.position    ?? 0,
      is_active:   o.is_active   ?? true,
      is_default:  o.is_default  ?? false,
    });
    setFormError(''); setModal('edit');
  };
  const openDelete = (o)  => { setSelected(o); setModal('delete'); };
  const closeModal = ()   => { setModal(null); setSelected(null); setFormError(''); };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload = {
        ...form,
        amount:   Number(form.amount),
        position: Number(form.position),
      };
      if (modal === 'create') {
        await api.post('/orders/admin/delivery-options/', payload);
      } else {
        await api.put(`/orders/admin/delivery-options/${selected.id}/`, payload);
      }
      closeModal();
      fetchOptions();
    } catch (err) {
      const d = err.response?.data;
      setFormError(typeof d === 'string' ? d : d?.detail ?? JSON.stringify(d) ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/orders/admin/delivery-options/${selected.id}/`);
      closeModal();
      fetchOptions();
    } catch {
      setFormError('Suppression impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (opt) => {
    try {
      await api.patch(`/orders/admin/delivery-options/${opt.id}/`, { is_active: !opt.is_active });
      setOptions((prev) => prev.map((o) => o.id === opt.id ? { ...o, is_active: !opt.is_active } : o));
    } catch {
      setError('Impossible de modifier le statut.');
    }
  };

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Options de livraison</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Options de livraison</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle option
          </button>
        </div>

        {error && <div style={{ padding: '0 1.6rem' }}><div className="alert alert-error">{error}</div></div>}

        {loading ? (
          <div className="loading"><div className="spinner" /><span className="loading-text">Chargement</span></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Pos.</th><th>Nom</th><th>Description</th><th>Montant</th><th>Devise</th><th>Défaut</th><th>Actif</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {options.length === 0 ? (
                  <tr><td colSpan={8} className="td-empty">Aucune option de livraison.</td></tr>
                ) : options.map((o) => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>{o.position ?? 0}</td>
                    <td style={{ fontWeight: 400 }}>{o.name}</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.description ?? '—'}
                    </td>
                    <td>{o.amount != null ? `${Number(o.amount).toLocaleString('fr-FR')}` : '—'}</td>
                    <td style={{ fontSize: '0.72rem' }}>{o.currency ?? 'XOF'}</td>
                    <td>
                      {o.is_default
                        ? <span className="badge badge-info">Défaut</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>}
                    </td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={!!o.is_active} onChange={() => handleToggleActive(o)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDelete(o)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Nouvelle option' : 'Modifier l\'option'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Montant</label>
                  <input className="form-input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Devise</label>
                  <input className="form-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="XOF" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Position (ordre d'affichage)</label>
                  <input className="form-input" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                  <span className="form-label" style={{ margin: 0 }}>Activer</span>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                  <span className="form-label" style={{ margin: 0 }}>Option par défaut</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Supprimer l'option</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6 }}>
                Supprimer l'option <strong>{selected?.name}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
