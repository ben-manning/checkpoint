import { createContext, useState, useContext } from 'react';
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const login = (userDetails) => {
    // userDetails will be an object: { id/name/email } for the moment.

    if (userDetails) {
      setCurrentUser(userDetails);
    }
  }

  const logout = () => {
    if (currentUser) {
      setCurrentUser(null);
    }
  }

  return (
    <AuthContext value={{ currentUser, login, logout }}>
      { children }
    </AuthContext>
  )
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;