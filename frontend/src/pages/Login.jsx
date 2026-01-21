import React, { useContext, useState } from 'react'
import { AppContext } from '../contexts/AppContext'
import { useNavigate } from 'react-router-dom'
import '../css/Auth.css'

const Login = () => {
    const navigate = useNavigate()
    const { login, userData } = useContext(AppContext)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Clear fields on mount to prevent browser autofill issues
    React.useEffect(() => {
        setEmail('')
        setPassword('')
    }, [])

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        const data = await login(email, password)
        if (data && data.success) {
            setEmail('')
            setPassword('')
            if (data.user?.role === 'admin') {
                navigate('/admin')
            } else {
                navigate('/user')
            }
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
                <p className='auth-subtitle'>Welcome Back</p>

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

                    <button className='btn-auth'>Login</button>
                </form>

                <p className='auth-footer'>
                    Don't have an account? <span onClick={() => navigate('/signup')} className='auth-link'>Create a New Account</span>
                </p>
            </div>
        </div>
    )
}

export default Login
