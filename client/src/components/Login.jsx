import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Stub: replace with API call in future sprint
    login({ email: formData.email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>
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