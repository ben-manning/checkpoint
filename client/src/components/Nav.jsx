import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/useAuth.jsx';
import '../styles/shared.css';
import checkpointNavbarLogo from '../assets/checkpoint-icons/checkpoint-navbar.svg';

const Nav = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className='navbar'>
      <div className='nav-left'>
        <Link to='/' className='navbar-home-link' aria-label='Home'>
          <img className='navbar-home-logo' src={checkpointNavbarLogo} alt='Checkpoint home' />
        </Link>
      </div>
      <div className='nav-right'>
        {currentUser ? (
          <>
            <span className='user'>{currentUser.name}</span>
            <button className='btn' onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <NavLink to='/login' className={({ isActive }) => isActive ? 'active' : ''}>
              Login
            </NavLink>
            <NavLink to='/register' className={({ isActive }) => isActive ? 'active' : ''}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;