import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router';
import Home from './components/Home.jsx';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './App.css'

const PrivateRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  return children;
};

function App() {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(currentUser);
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route 
          path='/dashboard' 
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} >
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </>
  )
}

export default App
