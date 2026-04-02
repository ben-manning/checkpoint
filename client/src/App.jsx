import React from 'react';
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import Home from './components/Home.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProjectDetails from './components/ProjectDetails.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './context/useAuth.jsx';
import { setOnUnauthorized } from './api/axios.js';
import Nav from './components/Nav.jsx';
import './App.css'
import './styles/shared.css'

const PrivateRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  return children;
};

function App() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      navigate('/login', { replace: true });
    });
  }, [logout, navigate]);

  return (
    <>
      <Nav />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route 
          path='/dashboard' 
          element={
            <PrivateRoute isAuthenticated={currentUser} >
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route
          path='/projects/:id'
          element={
            <PrivateRoute isAuthenticated={currentUser}>
              <ProjectDetails />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
