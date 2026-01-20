import React, { useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../../contexts/AppContext'
import '../../css/Navbar.css'

const Navbar = () => {
    const { userData, logout } = useContext(AppContext)
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <nav className='navbar'>
            <div className='nav-logo' onClick={() => navigate('/')}>
                MsgBulkHub
            </div>

            <div className='nav-links'>
                {userData ? (
                    <>
                        {userData.role === 'admin' ? (
                            <>
                                <Link to="/user" className={`nav-item ${location.pathname === '/user' ? 'active' : ''}`}>User Page</Link>
                                <Link to="/admin" className={`nav-item nav-item-admin ${location.pathname === '/admin' ? 'active' : ''}`}>Admin Dashboard</Link>
                            </>
                        ) : (
                            <Link to="/user" className={`nav-item ${location.pathname === '/user' ? 'active' : ''}`}>User Page</Link>
                        )}

                        <div className='nav-user-info'>
                            <div className='nav-user-text'>
                                <p className='nav-user-email'>{userData.email}</p>
                                <p className='nav-user-meta'>{userData.role} • {userData.credits} Credits</p>
                            </div>
                            <button
                                onClick={logout}
                                className='btn-logout'
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <div className='nav-auth-btns'>
                        <button
                            onClick={() => navigate('/login')}
                            className={`btn-login ${location.pathname === '/login' ? 'active' : ''}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className={`btn-signup ${location.pathname === '/signup' ? 'active' : ''}`}
                        >
                            Create New Account
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
