import { createContext, useState, useContext } from 'react';
import { setAuthToken } from '../api/axios.js';
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = ({ user, token: jwtToken }) => {
    if (user && jwtToken) {
      setCurrentUser(user);
      setToken(jwtToken);
      setAuthToken(jwtToken);
    }
  }

  const logout = () => {
    if (currentUser || token) {
      setCurrentUser(null);
      setToken(null);
      setAuthToken(null);
    }
  }

  return (
    <AuthContext value={{ currentUser, token, login, logout }}>
      { children }
    </AuthContext>
  )
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;