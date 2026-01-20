import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../contexts/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../css/Dashboard.css'

const SmsHistory = () => {
    const navigate = useNavigate()
    const { userData, backendUrl } = useContext(AppContext)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/msg/history', {
                headers: { 'x-api-key': userData.apiKey }
            })
            if (data.success) {
                setHistory(data.history)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load history")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userData) {
            fetchHistory()
        }
    }, [userData])

    return (
        <div className='dashboard-container' style={{ maxWidth: '1280px' }}>
            <div className='card' style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className='card-title'>Message History</h2>
                    <button onClick={() => navigate('/user')} className='btn-submit' style={{ width: 'auto', padding: '0 1.5rem', height: '3rem' }}>
                        Back to Dashboard
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading history...</p>
                ) : history.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No messages sent yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DATE</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DESTINATION</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MESSAGE</th>
                                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((sms) => (
                                    <tr key={sms._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {new Date(sms.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {sms.to}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', maxWidth: '300px' }}>
                                            {sms.message}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge badge-${sms.status}`}>
                                                {sms.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SmsHistory
