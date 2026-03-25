import { useAuth } from '../context/useAuth.jsx';

const Nav = () => {
  const { currentUser, logout } = useAuth();

  return (
    <nav>
      <span>{currentUser ? `Logged in as ${currentUser.name}` : 'Not logged in'}</span>
      {currentUser && (
        <button onClick={logout}>Log Out</button>
      )}
    </nav>
  );
};

export default Nav;
