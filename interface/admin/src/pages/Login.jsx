import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/', { email: form.email, password: form.password });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      const payload = JSON.parse(atob(data.access.split('.')[1]));
      if (!payload.is_admin && !payload.is_staff) {
        setError('Accès réservé aux administrateurs.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.brand}>SCENTARA</span>
          <span style={styles.brandSub}>Administration</span>
          <div style={styles.divider} />
          <h1 style={styles.title}>Connexion</h1>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              className="form-input"
              type="email"
              required
              autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Accéder au panneau'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--navy)',
    padding: '2rem',
  },
  card: {
    background: 'var(--white)',
    width: '100%',
    maxWidth: 400,
    padding: '2.5rem',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  brand: {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 300,
    letterSpacing: '0.4em',
    color: 'var(--navy)',
    marginBottom: '0.2rem',
  },
  brandSub: {
    display: 'block',
    fontSize: '0.6rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    fontWeight: 400,
    marginBottom: '1.25rem',
  },
  divider: {
    width: 40,
    height: 1,
    background: 'var(--gold)',
    margin: '0 auto 1.25rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 300,
    color: 'var(--navy)',
    letterSpacing: '0.1em',
  },
};
