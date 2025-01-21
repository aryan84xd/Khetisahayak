import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import supabase from "./utils/superbaseClient";
import Preheader from "./components/Preheader";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import DashBoard from "./pages/DashBoard";
import Register from "./pages/Register";
import Search from "./pages/Search";


const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession(); // Fetch the initial session
      setUser(session?.user || null);
      setLoading(false);
    };

    fetchSession();

    // Subscribe to auth state changes
    const { subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Cleanup: Unsubscribe from the auth listener
    return () => subscription?.unsubscribe && subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log(user);
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Preheader />
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to="/auth" />}>
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="register" element={<Register />} />
            <Route path="search" element={<Search />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
};

export default App;
