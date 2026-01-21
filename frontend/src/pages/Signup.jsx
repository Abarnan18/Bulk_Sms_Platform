import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../contexts/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import '../css/Auth.css'

const Signup = () => {
    const navigate = useNavigate()
    const { register, userData } = useContext(AppContext)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        setEmail('')
        setPassword('')
    }, [])

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        const success = await register(email, password)
        if (success) {
            setEmail('')
            setPassword('')
            // Use a short timeout to ensure state is updated before navigating
            setTimeout(() => {
                navigate('/user')
            }, 100)
        }
    }

    return (
        <div className='auth-container'>
            {/* Animated Decoration */}
            <div className='animated-bg-decor'>
                <div className='decor-sender'>
                    <span>👤</span>
                    <p>SENDER</p>
                </div>
                <div className='flying-sms sms-1'>📩</div>
                <div className='flying-sms sms-2'>✉️</div>
                <div className='flying-sms sms-3'>💬</div>
                <div className='flying-sms sms-4'>💌</div>
                <div className='flying-sms sms-5'>📝</div>
                <div className='decor-receivers'>
                    <div className='receiver-icon'>👨‍💼</div>
                    <div className='receiver-icon'>👩‍💻</div>
                    <div className='receiver-icon'>🧑‍🎓</div>
                    <div className='receiver-icon'>🤶</div>
                    <div className='receiver-icon'>👷</div>
                    <div className='receiver-icon'>👩‍🔬</div>
                    <div className='receiver-icon'>👨‍🎨</div>
                    <div className='receiver-icon'>👵</div>
                    <div className='receiver-icon'>👨‍🍳</div>
                </div>
            </div>

            <div className='auth-card'>
                <h1 className='auth-title'>MsgBulkHub</h1>
                <p className='auth-subtitle'>Create Your Account</p>

                <form onSubmit={onSubmitHandler} autoComplete="off">
                    <div className='form-group'>
                        <div className='input-icon-wrapper'>
                            <span className='input-icon'>📧</span>
                            <input
                                onChange={e => setEmail(e.target.value)}
                                value={email}
                                className='auth-input'
                                type="email"
                                placeholder='Email Id'
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <div className='form-group'>
                        <div className='input-icon-wrapper'>
                            <span className='input-icon'>🔒</span>
                            <input
                                onChange={e => setPassword(e.target.value)}
                                value={password}
                                className='auth-input'
                                type="password"
                                placeholder='Password'
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button className='btn-auth'>Register</button>
                </form>

                <p className='auth-footer'>
                    Already have an account? <span onClick={() => navigate('/login')} className='auth-link'>Login here</span>
                </p>
            </div>
        </div>
    )
}

export default Signup
