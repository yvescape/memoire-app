import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const CATEGORIES = ['Eau de Parfum', 'Eau de Toilette', 'Extrait de Parfum'];
const FAMILIES   = ['Floral', 'Boisé', 'Oriental', 'Fruité', 'Aromatique'];
const GENDERS    = ['Homme', 'Femme', 'Unisexe'];

const EMPTY_FORM = {
  name: '', category: '', family: '', gender: '',
  price: '', size: '', image: '', badge: '',
  notes_top: '', notes_heart: '', notes_base: '',
  composition: '', advice: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const PAGE_SIZE = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const { data } = await api.get('/products/', { params });
      const list = Array.isArray(data) ? data : data.results ?? data.products ?? [];
      setProducts(list);
      setTotal(data.count ?? list.length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create'); };
  const openEdit   = (p)  => {
    setSelected(p);
    setForm({
      name:        p.name        ?? '',
      category:    p.category    ?? '',
      family:      p.family      ?? '',
      gender:      p.gender      ?? '',
      price:       p.price       ?? '',
      size:        p.size        ?? '',
      image:       p.image       ?? '',
      badge:       p.badge       ?? '',
      notes_top:   p.notes_top   ?? '',
      notes_heart: p.notes_heart ?? '',
      notes_base:  p.notes_base  ?? '',
      composition: p.composition ?? '',
      advice:      p.advice      ?? '',
    });
    setFormError(''); setModal('edit');
  };
  const openDelete = (p)  => { setSelected(p); setModal('delete'); };
  const closeModal = ()   => { setModal(null); setSelected(null); setFormError(''); };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (modal === 'create') {
        await api.post('/products/', payload);
      } else {
        await api.put(`/products/${selected.id}/`, payload);
      }
      closeModal();
      fetchProducts();
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
      await api.delete(`/products/${selected.id}/`);
      closeModal();
      fetchProducts();
    } catch {
      setFormError('Suppression impossible.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const textField = (key, label, hint = '') => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="text"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );

  const selectField = (key, label, options) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <select
        className="form-input"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      >
        <option value="">— Choisir —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const textareaField = (key, label) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <textarea
        className="form-textarea"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <>
      <div className="breadcrumb">
        <span>Admin</span><span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Produits</span>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Catalogue produits</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau produit
          </button>
        </div>

        <div style={{ padding: '1.15rem 1.6rem 0' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" placeholder="Rechercher un produit…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                  <tr><th>ID</th><th>Nom</th><th>Catégorie</th><th>Famille</th><th>Genre</th><th>Taille</th><th>Prix (FCFA)</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={8} className="td-empty">Aucun produit.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>#{p.id}</td>
                      <td style={{ fontWeight: 400 }}>{p.name}</td>
                      <td style={{ fontSize: '0.72rem' }}>{p.category ?? '—'}</td>
                      <td>{p.family ?? '—'}</td>
                      <td>{p.gender ?? '—'}</td>
                      <td style={{ fontSize: '0.72rem' }}>{p.size ?? '—'}</td>
                      <td>{p.price != null ? `${Number(p.price).toLocaleString('fr-FR')} FCFA` : '—'}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Modifier</button>
                          <button className="btn btn-danger btn-sm" onClick={() => openDelete(p)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page} / {totalPages} — {total} produits</span>
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

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Nouveau produit' : 'Modifier le produit'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}

              {/* Identité */}
              <div className="form-row">
                {textField('name', 'Nom du produit')}
                <div className="form-group">
                  <label className="form-label">Prix (FCFA)</label>
                  <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                {selectField('category', 'Catégorie', CATEGORIES)}
                {textField('size', 'Contenance (ex: 50ml)')}
              </div>
              <div className="form-row">
                {selectField('family', 'Famille olfactive', FAMILIES)}
                {selectField('gender', 'Genre', GENDERS)}
              </div>

              {/* Visuel */}
              <div className="form-row">
                {textField('image', 'URL image')}
                {textField('badge', 'Badge (ex: Nouveau, Best-seller)')}
              </div>

              {/* Notes olfactives */}
              <div className="form-row">
                {textField('notes_top',   'Notes de tête')}
                {textField('notes_heart', 'Notes de cœur')}
                {textField('notes_base',  'Notes de fond')}
              </div>

              {/* Textes longs */}
              {textareaField('composition', 'Composition')}
              {textareaField('advice',      'Conseils d\'utilisation')}
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

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirmer la suppression</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6 }}>
                Voulez-vous supprimer définitivement le produit <strong>{selected?.name}</strong> ?
                Cette action est irréversible.
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
