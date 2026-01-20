import React, { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../contexts/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import '../css/Auth.css'
import '../css/Verify.css'

const Verify = () => {
    const { backendUrl, isLoggedin, userData, getUserData, logout } = useContext(AppContext)
    const navigate = useNavigate()
    const inputRefs = useRef([])
    const [timer, setTimer] = useState(0) // Resend timer (30s)
    const [validityTimer, setValidityTimer] = useState(600) // OTP Validity timer (10m)
    const [isResending, setIsResending] = useState(false)

    // Format seconds into MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    const handleInput = (e, index) => {
        if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1].focus()
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text')
        const pasteArray = paste.slice(0, 4).split('')
        pasteArray.forEach((char, index) => {
            if (inputRefs.current[index]) {
                inputRefs.current[index].value = char
            }
        })
    }

    const resendOtp = async () => {
        if (timer > 0) return

        setIsResending(true)
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/send-otp', {
                userId: userData._id,
                resend: true
            })
            if (data.success) {
                toast.success(data.message)
                setTimer(30)
                setValidityTimer(600) // Reset validity timer on resend
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend code')
            if (error.response?.data?.message.includes('wait')) {
                const seconds = parseInt(error.response.data.message.match(/\d+/)?.[0] || '30')
                setTimer(seconds)
            }
        } finally {
            setIsResending(false)
        }
    }

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
            const otpArray = inputRefs.current.map(e => e.value)
            const otp = otpArray.join('')

            if (otp.length < 4) {
                toast.error("Please enter the full 4-digit code")
                return
            }

            const { data } = await axios.post(backendUrl + '/api/auth/verify-otp', {
                userId: userData._id,
                otp
            })

            if (data.success) {
                toast.success(data.message)
                getUserData()
                navigate('/')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    useEffect(() => {
        if (isLoggedin && userData && userData.isVerified) {
            navigate('/')
        }
    }, [isLoggedin, userData, navigate])

    // Resend Timer countdown
    useEffect(() => {
        let interval = null
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1)
            }, 1000)
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [timer])

    // Validity Timer countdown
    useEffect(() => {
        let interval = null
        if (validityTimer > 0) {
            interval = setInterval(() => {
                setValidityTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [validityTimer])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    if (!userData) return null

    return (
        <div className='auth-container'>
            <div className='auth-decoration-wrapper'></div>
            <form onSubmit={onSubmitHandler} className='auth-card'>
                <div className="verify-header">
                    <h1 className='auth-title'>Verification Code</h1>
                    <p className='auth-subtitle'>
                        Enter the OTP you received to <br />
                        <span style={{ color: '#fff' }}>{userData.email}</span>
                    </p>
                </div>

                <div className="otp-validity-wrapper">
                    <p className="otp-validity-label">OTP validity</p>
                    <p className="otp-validity-timer">{formatTime(validityTimer)}</p>
                </div>

                <div className='otp-inputs' onPaste={handlePaste}>
                    {Array(4).fill(0).map((_, index) => (
                        <input
                            type="text"
                            maxLength='1'
                            key={index}
                            required
                            className='otp-field'
                            ref={e => inputRefs.current[index] = e}
                            onInput={(e) => handleInput(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                <button className='btn-auth'>Verify</button>

                <div className='resend-container'>
                    {timer > 0 ? (
                        <span>Didn't receive the code? Resend OTP in {formatTime(timer)}</span>
                    ) : (
                        <span>
                            Didn't receive the code?
                            <button
                                type="button"
                                onClick={resendOtp}
                                className='btn-resend-link'
                                disabled={isResending}
                            >
                                Resend OTP
                            </button>
                        </span>
                    )}
                </div>

                <div className="verify-footer">
                    <a href="mailto:support@msgbulkhub.com" className="footer-link">
                        Need help? <span className="footer-action">Contact Us!</span>
                    </a>
                    <div className="footer-link">
                        Need to change account?
                        <span className="footer-action" onClick={handleLogout}>Log out.</span>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default Verify
