import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import SavedItems from './pages/SavedItems';
import { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme); // theme = "dark" or "light"
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setView('home');
      }
    };
    getSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
  };

  return (
    <>
      {(!user && view === 'login') && (
        <>
          <Login
            onLogin={(u) => {
              setUser(u);
              setView('home');
            }}
            switchToSignup={() => setView("signup")}
          />
        </>
      )}

      {(!user && view === 'signup') && (
        <>
          <Signup
            onLogin={(u) => {
              setUser(u);
              setView('home');
            }}
            switchToLogin={() => setView("login")}
          />
        </>
      )}

      {user && view === 'home' && (
        <Home
          user={user}
          onLogout={handleLogout}
          setView={setView}
          theme={theme}
          setTheme={setTheme}
        />
      )}


      {user && view === 'saved' && (
        <SavedItems
          user={user}
          setView={setView}
        />
      )}

      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
