import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('active_session_id') || null;
  });

  const updateSession = (newId) => {
    if (newId) {
      setSessionId(newId);
      localStorage.setItem('active_session_id', newId);
    }
  };

  const clearSession = () => {
    setSessionId(null);
    localStorage.removeItem('active_session_id');
  };

  return (
    <SessionContext.Provider value={{ sessionId, updateSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
