import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // token and userId are persisted in localStorage so page refresh keeps the session
  const [token,  setToken]  = useState(() => localStorage.getItem('aa_token')  || null);
  const [userId, setUserId] = useState(() => localStorage.getItem('aa_userId') || null);

  function login(jwt, id) {
    localStorage.setItem('aa_token',  jwt);
    localStorage.setItem('aa_userId', String(id));
    setToken(jwt);
    setUserId(String(id));
  }

  function logout() {
    localStorage.removeItem('aa_token');
    localStorage.removeItem('aa_userId');
    setToken(null);
    setUserId(null);
  }

  return (
    <AuthContext.Provider value={{ token, userId, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
