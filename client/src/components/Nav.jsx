
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';

const Nav = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
        {currentUser && (
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
        )}
      </div>
      <div className="nav-right">
        {currentUser ? (
          <>
            <span className="user">{currentUser.name}</span>
            <button className="btn" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;
