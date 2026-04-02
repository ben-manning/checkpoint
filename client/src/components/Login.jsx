
import React from 'react';
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import api from '../api/axios.js';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      const response = await api.post('/auth/login', formData);
      login(response.data);
      navigate(from, { replace: true });
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to login with those credentials');
    }
  };

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section className="container" style={{ maxWidth: 400, margin: '0 auto', background: 'var(--bg)', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '2.5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--accent)' }}>Log In</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && <p style={{ color: '#bf0f2f', background: 'rgba(191,15,47,0.07)', borderRadius: 8, padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 500 }}>{error}</p>}
          <input
            type='email'
            name='email'
            placeholder='Email'
            value={formData.email}
            onChange={handleChange}
            required
            style={{ padding: '0.8rem 1rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
          />
          <input
            type='password'
            name='password'
            placeholder='Password'
            value={formData.password}
            onChange={handleChange}
            required
            style={{ padding: '0.8rem 1rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
          />
          <button type='submit' className='btn btn-primary' style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Log In</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '1rem' }}>
          <span style={{ color: 'var(--text)' }}>Don't have an account?</span>{' '}
          <Link to='/register' className='link'>Register</Link>
        </div>
      </section>
    </main>
  );
};

export default Login;