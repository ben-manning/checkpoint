
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../api/axios.js';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      login(response.data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to register with those details');
    }
  };

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section className="container" style={{ maxWidth: 400, margin: '0 auto', background: 'var(--bg)', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '2.5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--accent)' }}>Register</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && <p style={{ color: '#bf0f2f', background: 'rgba(191,15,47,0.07)', borderRadius: 8, padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 500 }}>{error}</p>}
          <input
            type='text'
            name='name'
            placeholder='Name'
            value={formData.name}
            onChange={handleChange}
            required
            style={{ padding: '0.8rem 1rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
          />
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
          <input
            type='password'
            name='confirmPassword'
            placeholder='Confirm Password'
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ padding: '0.8rem 1rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
          />
          <button type='submit' className='btn btn-primary' style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Create Account</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '1rem' }}>
          <span style={{ color: 'var(--text)' }}>Already have an account?</span>{' '}
          <Link to='/login' className='link'>Log In</Link>
        </div>
      </section>
    </main>
  );
}

export default Register;