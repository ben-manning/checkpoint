import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios.js';
import { useAuth } from '../context/useAuth.jsx';

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
    <form onSubmit={handleSubmit}>
      <h3>Register</h3>
      {error && <p>{error}</p>}
      <input
        type='text'
        name='name'
        placeholder='Name'
        value={formData.name}
        onChange={handleChange}
      />
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
      <input
        type='password'
        name='confirmPassword'
        placeholder='Confirm Password'
        value={formData.confirmPassword}
        onChange={handleChange}
      />
      <button type='submit'>Create Account</button>
    </form>
  );
}

export default Register;