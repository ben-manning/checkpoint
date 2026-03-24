import { useState } from 'react';

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

export default {
  login,
  logout
}