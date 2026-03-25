import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import api from '../api/axios.js';
import { useAuth } from '../context/useAuth.jsx';

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
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>
      {error && <p>{error}</p>}
      <input
        type='email'
        name='email'
        placeholder='Email'
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type='password'
        name='password'
        placeholder='Password'
        value={formData.password}
        onChange={handleChange}
      />
      <button type='submit'>Log In</button>
    </form>
  );
};

export default Login;