import { useState, useEffect } from 'react';
import { AuthPage } from './pages/AuthPage.js';
import { TasksPage } from './pages/TasksPage.js';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(localStorage.getItem('token'));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
  };

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <TasksPage onLogout={handleLogout} />;
}

export default App;
