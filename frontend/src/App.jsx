import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AppContext } from './contexts/AppContext'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/User'
import AdminDashboard from './pages/Admin'
import Verify from './pages/Verify'
import SmsHistory from './pages/SmsHistory'

const App = () => {
  const { isLoggedin, userData, loading } = useContext(AppContext)

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing...</p>
      </div>
    )
  }

  return (
    <div className='app-main'>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Redirect away from Login/Signup if already logged in */}
        <Route
          path="/login"
          element={!isLoggedin ? <Login /> : <Navigate to={userData?.role === 'admin' ? '/admin' : '/user'} />}
        />
        <Route
          path="/signup"
          element={!isLoggedin ? <Signup /> : <Navigate to={userData?.role === 'admin' ? '/admin' : '/user'} />}
        />

        <Route path="/verify" element={isLoggedin ? <Verify /> : <Navigate to="/login" />} />

        {/* Protected User Routes */}
        <Route path="/user" element={isLoggedin ? <UserDashboard /> : <Navigate to="/login" />} />
        <Route path="/user/history" element={isLoggedin ? <SmsHistory /> : <Navigate to="/login" />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            isLoggedin && userData?.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/login" />
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App