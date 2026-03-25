import { createContext, useState, useContext } from 'react';
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = ({ user, token: jwtToken }) => {
    if (user && jwtToken) {
      setCurrentUser(user);
      setToken(jwtToken);
    }
  }

  const logout = () => {
    if (currentUser || token) {
      setCurrentUser(null);
      setToken(null);
    }
  }

  const getAuthHeaders = () => (
    token ? { Authorization: `Bearer ${token}` } : {}
  );

  return (
    <AuthContext value={{ currentUser, token, login, logout, getAuthHeaders }}>
      { children }
    </AuthContext>
  )
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;