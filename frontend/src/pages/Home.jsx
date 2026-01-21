import React, { useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppContext } from '../contexts/AppContext'
import '../css/Home.css'

const Home = () => {
    const navigate = useNavigate()
    const { isLoggedin, userData } = useContext(AppContext)

    return (
        <div className='home-container'>
            <div className='home-content'>
                <div className='hero-section'>
                    <h1 className='hero-title'>
                        Welcome to <span className='brand-name'>MsgBulkHub</span>
                    </h1>
                    <p className='hero-subtitle'>
                        Send bulk messages to thousands of contacts within seconds!
                    </p>

                    {!isLoggedin ? (
                        <div className='hero-buttons'>
                            <button className='btn-primary' onClick={() => navigate('/signup')}>
                                Get Started
                            </button>
                            <button className='btn-secondary' onClick={() => navigate('/login')}>
                                Login
                            </button>
                        </div>
                    ) : (
                        <div className='hero-buttons'>
                            {userData?.role === 'admin' ? (
                                <>
                                    <button className='btn-primary' onClick={() => navigate('/admin')}>
                                        Admin Dashboard
                                    </button>
                                </>
                            ) : userData?.isVerified ? (
                                <Link to='/user' className='btn-primary'>
                                    User Page
                                </Link>
                            ) : (
                                <button className='btn-primary' onClick={() => navigate('/admin')}>
                                    Go to Dashboard
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className='features-section'>
                    <h2>Why Choose MsgBulkHub?</h2>
                    <div className='features-grid'>
                        <div className='feature-card'>
                            <div className='feature-icon'>📨</div>
                            <h3>Fast Delivery</h3>
                            <p>Send messages to thousands instantly with our reliable infrastructure</p>
                        </div>
                        <div className='feature-card'>
                            <div className='feature-icon'>🔐</div>
                            <h3>Secure</h3>
                            <p>Your data is encrypted and protected with enterprise-grade security</p>
                        </div>
                        <div className='feature-card'>
                            <div className='feature-icon'>💰</div>
                            <h3>Affordable</h3>
                            <p>Flexible pricing that scales with your business needs</p>
                        </div>
                        <div className='feature-card'>
                            <div className='feature-icon'>📊</div>
                            <h3>Analytics</h3>
                            <p>Track delivery status and get detailed analytics for each campaign</p>
                        </div>
                        <div className='feature-card'>
                            <div className='feature-icon'>🚀</div>
                            <h3>Easy to Use</h3>
                            <p>Simple interface that anyone can use without technical knowledge</p>
                        </div>
                        <div className='feature-card'>
                            <div className='feature-icon'>🎯</div>
                            <h3>Targeted</h3>
                            <p>Send targeted messages to specific customer segments</p>
                        </div>
                    </div>
                </div>

                <div className='stats-section'>
                    <div className='stat'>
                        <h3>10M+</h3>
                        <p>Messages Sent</p>
                    </div>
                    <div className='stat'>
                        <h3>5K+</h3>
                        <p>Active Users</p>
                    </div>
                    <div className='stat'>
                        <h3>99.9%</h3>
                        <p>Uptime</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
