import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../contexts/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../css/Dashboard.css'

const UserDashboard = () => {
    const navigate = useNavigate()
    const { userData, backendUrl, getUserData } = useContext(AppContext)
    const [myRequests, setMyRequests] = useState([])
    const [requestType, setRequestType] = useState('credit')
    const [requestAmount, setRequestAmount] = useState('')
    const [requestReason, setRequestReason] = useState('')
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [activeSmsTab, setActiveSmsTab] = useState('single')

    // Single SMS States
    const [recipient, setRecipient] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    // Bulk SMS States
    const [bulkNumbers, setBulkNumbers] = useState('')
    const [bulkMessage, setBulkMessage] = useState('')
    const [bulkFile, setBulkFile] = useState(null)
    const [isBulkSending, setIsBulkSending] = useState(false)
    const [inputMethod, setInputMethod] = useState('manual')
    const [failedNumbers, setFailedNumbers] = useState('')

    const [isOtpLoading, setIsOtpLoading] = useState(false)

    const sendOtp = async () => {
        if (isOtpLoading) return;
        setIsOtpLoading(true);
        const toastId = toast.loading("Sending verification email...")
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/send-otp', { userId: userData._id })
            if (data.success) {
                toast.update(toastId, { render: data.message, type: "success", isLoading: false, autoClose: 3000 });
                navigate('/verify')
            } else {
                toast.update(toastId, { render: data.message, type: "error", isLoading: false, autoClose: 3000 });
            }
        } catch (error) {
            toast.update(toastId, {
                render: error.response?.data?.message || "Failed to send email. Check backend connectivity.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setIsOtpLoading(false);
        }
    }

    const fetchMyRequests = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/requests')
            if (data.success) {
                setMyRequests(data.requests)
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    const submitRequest = async (e) => {
        e.preventDefault()
        try {
            const { data } = await axios.post(backendUrl + '/api/user/request', {
                type: requestType,
                amount: requestType === 'credit' ? requestAmount : 0,
                reason: requestReason
            })
            if (data.success) {
                toast.success(data.message)
                setIsRequestModalOpen(false)
                setRequestAmount('')
                setRequestReason('')
                fetchMyRequests()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const sendSingleSms = async (e) => {
        e.preventDefault()
        if (userData.isBlocked) return toast.error("Account blocked. Cannot send message.")
        if (!userData.isVerified) return toast.error("Please verify account first.")

        setIsSending(true)
        try {
            const { data } = await axios.post(backendUrl + '/api/msg/send-single-sms', {
                recipient: recipient,
                message: message
            }, {
                headers: { 'x-api-key': userData.apiKey }
            })

            if (data.success) {
                toast.success("Message transmitted successfully")
                setRecipient('')
                setMessage('')
                getUserData()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Transmission failed")
        } finally {
            setIsSending(false)
        }
    }

    const sendBulkSms = async (e) => {
        e.preventDefault()
        if (userData.isBlocked) return toast.error("Account blocked. Cannot send message.")

        const formData = new FormData()
        formData.append('message', bulkMessage)
        if (bulkFile) {
            formData.append('csvFile', bulkFile)
        } else if (bulkNumbers) {
            formData.append('numbers', bulkNumbers)
        } else {
            return toast.error("Provide numbers or upload CSV")
        }

        setIsBulkSending(true)
        try {
            const { data } = await axios.post(backendUrl + '/api/msg/send-bulk-sms', formData, {
                headers: {
                    'x-api-key': userData.apiKey,
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (data.success) {
                toast.success(data.message)
                setBulkNumbers('')
                setBulkMessage('')
                setBulkFile(null)
                setFailedNumbers('') // Clear previous errors

                // Handle partial failures or invalid numbers
                let failureText = ''

                if (data.data.invalidList && data.data.invalidList.length > 0) {
                    failureText += data.data.invalidList.map(item => item.number + " (" + item.reason + ")").join('\n')
                }

                if (data.data.sentList && data.data.sentList.length > 0) {
                    const failedSends = data.data.sentList.filter(item => item.status === 'failed')
                    if (failedSends.length > 0) {
                        const failedStr = failedSends.map(item => item.number + " (Transmission Failed)").join('\n')
                        failureText = failureText ? failureText + '\n' + failedStr : failedStr
                    }
                }

                if (failureText) {
                    setFailedNumbers(failureText)
                }

                getUserData()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Bulk transmission failed")
            const invalidItems = error.response?.data?.invalidList || error.response?.data?.invalidNumbers
            if (invalidItems && invalidItems.length > 0) {
                const invalidStr = invalidItems.map(item => item.number + " (" + item.reason + ")").join('\n')
                setFailedNumbers(invalidStr)
            }
        } finally {
            setIsBulkSending(false)
        }
    }

    // Real-time updates for user status and credits
    useEffect(() => {
        if (userData) {
            fetchMyRequests()
            const interval = setInterval(() => {
                getUserData()
                fetchMyRequests()
            }, 30000)
            return () => clearInterval(interval)
        }
    }, [userData._id]) // use ID to avoid infinite loops if object reference changes but data is same

    if (!userData) return null

    return (
        <div className='dashboard-container' style={{ maxWidth: '1280px' }}>

            {/* Real-time Status Banners */}
            {!userData.isVerified && (
                <div className='banner' style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                    <div className='banner-content'>
                        <div>
                            <p style={{ fontWeight: 800, color: 'var(--warning)' }}>Action Required: Verification</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Confirm your email to enable messaging services.</p>
                        </div>
                    </div>
                    <button onClick={sendOtp} disabled={isOtpLoading} className='btn-banner' style={{ background: 'var(--warning)', opacity: isOtpLoading ? 0.7 : 1 }}>
                        {isOtpLoading ? 'SENDING...' : 'VERIFY NOW'}
                    </button>
                </div>
            )}

            {userData.isBlocked && (
                <div className='banner' style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                    <div className='banner-content'>
                        <div>
                            <p style={{ fontWeight: 800, color: 'var(--error)' }}>Account Restricted</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You are currently blocked by administrator. Send a request to restore access.</p>
                        </div>
                    </div>
                    <button onClick={() => { setRequestType('unblock'); setIsRequestModalOpen(true); }} className='btn-banner' style={{ background: 'var(--error)' }}>REQUEST UNBLOCK</button>
                </div>
            )}

            <div className='stats-grid'>
                <div className='stat-card' style={{ borderBottom: '3px solid var(--primary)' }}>
                    <p className='stat-label'>Balance</p>
                    <h2 className='stat-value'>{userData.credits} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Credits</span></h2>
                    <button onClick={() => { setRequestType('credit'); setIsRequestModalOpen(true); }} className='stat-btn' style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', marginTop: '1rem' }}>REFILL CREDITS</button>
                </div>

                <div className='stat-card' style={{ borderBottom: `3px solid ${userData.isBlocked ? 'var(--error)' : 'var(--success)'}` }}>
                    <p className='stat-label'>Status</p>
                    <div className='status-indicator'>
                        <span className={`dot ${userData.isBlocked ? 'dot-blocked' : 'dot-active'}`}></span>
                        <h2 className='stat-value'>{userData.isBlocked ? 'Restricted' : 'Operational'}</h2>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>{userData.isBlocked ? 'Awaiting administrative action' : 'System ready for dispatch'}</p>
                </div>

                <div className='stat-card' style={{ borderBottom: '3px solid var(--bg-surface)' }}>
                    <p className='stat-label'>API Key Identity</p>
                    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginTop: '0.5rem', overflow: 'hidden' }}>
                        <code style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{userData.apiKey || 'GENERATING...'}</code>
                    </div>
                </div>
            </div>

            <div className='content-grid' style={{ gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)' }}>
                {/* Messaging Center */}
                <div className='card'>
                    <div className='tabs' style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <button onClick={() => setActiveSmsTab('single')} className={`tab-btn ${activeSmsTab === 'single' ? 'tab-btn-active' : ''}`}>SINGLE SMS</button>
                            <button onClick={() => setActiveSmsTab('bulk')} className={`tab-btn ${activeSmsTab === 'bulk' ? 'tab-btn-active' : ''}`}>BULK CAMPAIGN</button>
                        </div>
                        <button onClick={() => navigate('/user/history')} className={`tab-btn ${activeSmsTab === 'history' ? 'tab-btn-active' : ''}`}>VIEW SENT MESSAGES</button>
                    </div>

                    {activeSmsTab === 'single' ? (
                        <form onSubmit={sendSingleSms}>
                            <div className='form-input-group'>
                                <label className='form-label'>DESTINATION NUMBER</label>
                                <input value={recipient} onChange={e => setRecipient(e.target.value)} className='form-input' type="text" placeholder="please enter only 94712345678 format " required />
                            </div>
                            <div className='form-input-group'>
                                <label className='form-label'>MESSAGE CONTENT</label>
                                <textarea value={message} onChange={e => setMessage(e.target.value)} className='form-textarea' placeholder="Enter notification content..." required></textarea>
                            </div>
                            <button disabled={isSending || userData.isBlocked} className='btn-submit' style={{ height: '3.5rem' }}>{isSending ? 'PROCESSING...' : 'Send SMS'}</button>
                        </form>
                    ) : (
                        <form onSubmit={sendBulkSms}>
                            {/* Input Method Toggle */}
                            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                                    <input
                                        type="radio"
                                        name="inputMethod"
                                        value="manual"
                                        checked={inputMethod === 'manual'}
                                        onChange={() => setInputMethod('manual')}
                                        style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                                    />
                                    Enter Manually
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                                    <input
                                        type="radio"
                                        name="inputMethod"
                                        value="file"
                                        checked={inputMethod === 'file'}
                                        onChange={() => setInputMethod('file')}
                                        style={{ marginRight: '0.5rem', accentColor: 'var(--primary)' }}
                                    />
                                    Upload CSV file
                                </label>
                            </div>

                            {inputMethod === 'file' ? (
                                <div className='form-input-group'>
                                    <label className='form-label'>UPLOAD CSV FILE</label>
                                    <input type="file" onChange={e => setBulkFile(e.target.files[0])} className='form-input' accept=".csv" required={inputMethod === 'file'} />
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '0.5rem' }}>CSV must contain a column named 'phone' or 'number'</p>
                                </div>
                            ) : (
                                <div className='form-input-group'>
                                    <label className='form-label'>ENTER NUMBERS (COMMA SEPARATED)</label>
                                    <textarea value={bulkNumbers} onChange={e => setBulkNumbers(e.target.value)} className='form-textarea' style={{ height: '4rem' }} placeholder="94712345678,94712345679,94123456780" required={inputMethod === 'manual'}></textarea>
                                </div>
                            )}

                            <div className='form-input-group'>
                                <label className='form-label'>CAMPAIGN MESSAGE</label>
                                <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className='form-textarea' placeholder="Campaign content for all recipients..." required></textarea>
                            </div>

                            <button disabled={isBulkSending || userData.isBlocked} className='btn-submit' style={{ height: '3.5rem' }}>{isBulkSending ? 'ENQUEUEING CAMPAIGN...' : 'Send Bulk SMS'}</button>

                            {/* Failed Numbers Display */}
                            {failedNumbers && (
                                <div className='form-input-group' style={{ marginTop: '1.5rem' }}>
                                    <label className='form-label' style={{ color: 'var(--error)' }}>FAILED / INVALID NUMBERS</label>
                                    <textarea
                                        value={failedNumbers}
                                        readOnly
                                        className='form-textarea'
                                        style={{ height: '6rem', borderColor: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--error)' }}
                                    ></textarea>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Tracking & Timeline */}
                <div className='card'>
                    <h3 className='card-title' style={{ fontSize: '1.2rem' }}>Administrative Requests</h3>
                    <div className='history-list'>
                        {myRequests.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>No recent requests found.</p>
                        ) : (
                            myRequests.map((req, index) => (
                                <div key={index} className='history-item' style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-main)' }}>{req.type.toUpperCase()} REQUEST</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {req._id.slice(-6)} • {new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`badge badge-${req.status}`}>
                                        {req.status.toUpperCase()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            {isRequestModalOpen && (
                <div className='modal-overlay'>
                    <div className='modal-card' style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <button onClick={() => setIsRequestModalOpen(false)} className='btn-close'>✕</button>
                        <h4 className='card-title' style={{ marginBottom: '1.5rem' }}>{requestType === 'credit' ? 'Provision Credits' : 'Restore Access'}</h4>
                        <form onSubmit={submitRequest}>
                            {requestType === 'credit' && (
                                <div className='form-input-group'>
                                    <label className='form-label'>REQUESTED QUANTITY</label>
                                    <input value={requestAmount} onChange={e => setRequestAmount(e.target.value)} className='form-input' type="number" placeholder="Amount" required />
                                </div>
                            )}
                            <div className='form-input-group'>
                                <label className='form-label'>JUSTIFICATION</label>
                                <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} className='form-textarea' style={{ height: '6rem' }} placeholder="Provide context..." required></textarea>
                            </div>
                            <button className='btn-submit'>SUBMIT REQUEST</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserDashboard
