import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../contexts/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../css/Dashboard.css'

const AdminDashboard = () => {
    const { backendUrl, userData } = useContext(AppContext)
    const [stats, setStats] = useState({ users: 0, pending: 0, blocked: 0, totalSms: 0 })
    const [pendingRequests, setPendingRequests] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [allSms, setAllSms] = useState([])
    const [activeTab, setActiveTab] = useState('requests') // requests, users, messages, actions

    // Action States
    const [actionEmail, setActionEmail] = useState('')
    const [actionCredits, setActionCredits] = useState('')
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [searchedUser, setSearchedUser] = useState(null)
    const [viewUser, setViewUser] = useState(null) // For Modal

    // Filters for Users
    const [userSearch, setUserSearch] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState('')

    // Filters for Messages
    const [filters, setFilters] = useState({
        email: '',
        status: '',
        date: ''
    })

    const fetchUsers = async () => {
        try {
            const queryParams = new URLSearchParams()
            if (userSearch) queryParams.append('search', userSearch)
            if (userStatusFilter) queryParams.append('status', userStatusFilter)

            const { data } = await axios.get(`${backendUrl}/api/admin/users?${queryParams.toString()}`)
            if (data.success) {
                setAllUsers(data.users)
                if (!userSearch && !userStatusFilter) {
                    setStats(prev => ({
                        ...prev,
                        users: data.count,
                        blocked: data.users.filter(u => u.isBlocked).length
                    }))
                }
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/requests')
            if (data.success) {
                setPendingRequests(data.requests)
                setStats(prev => ({ ...prev, pending: data.requests.length }))
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    const fetchMessages = async () => {
        try {
            const queryParams = new URLSearchParams()
            if (filters.email) queryParams.append('email', filters.email.trim())
            if (filters.status) queryParams.append('status', filters.status)
            if (filters.date) {
                queryParams.append('startDate', filters.date)
                queryParams.append('endDate', filters.date)
            }

            const { data } = await axios.get(`${backendUrl}/api/admin/sms-history?${queryParams.toString()}`)
            if (data.success) {
                setAllSms(data.sms)
                if (!filters.email && !filters.status && !filters.date) {
                    setStats(prev => ({ ...prev, totalSms: data.count }))
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages")
        }
    }

    const fetchData = () => {
        fetchUsers()
        fetchRequests()
        fetchMessages()
    }

    const handleRequest = async (requestId, status) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/handle-request', { requestId, status })
            if (data.success) {
                toast.success(data.message)
                fetchData()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    // New Dedicated Action Handlers
    const searchUserForAction = async () => {
        if (!actionEmail) return toast.error("Please enter Email or User ID")
        setIsActionLoading(true)
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/user/${actionEmail}`)
            if (data.success) {
                setSearchedUser(data.user)
                toast.success("User found")
            }
        } catch (error) {
            setSearchedUser(null)
            toast.error(error.response?.data?.message || "User not found")
        } finally {
            setIsActionLoading(false)
        }
    }

    const performAction = async (type, targetId = null) => {
        // If targetId is provided (from Users table), use it. Otherwise use searchedUser._id
        const idToUse = targetId || (searchedUser ? searchedUser._id : actionEmail);

        if (!idToUse) return toast.error("No user selected")

        setIsActionLoading(true)
        try {
            let endpoint = ''
            let payload = {}

            if (type === 'block') endpoint = `/api/admin/block-user/${idToUse}`
            else if (type === 'unblock') endpoint = `/api/admin/unblock-user/${idToUse}`
            else if (type === 'addCredits') {
                if (!actionCredits || isNaN(actionCredits)) {
                    setIsActionLoading(false)
                    return toast.error("Valid credit amount is required")
                }
                endpoint = `/api/admin/add-credits/${idToUse}`
                payload = { credits: actionCredits }
            }

            const { data } = await axios.post(backendUrl + endpoint, payload)
            if (data.success) {
                toast.success(data.message)
                if (type === 'addCredits') {
                    setActionCredits('')
                    // Refresh searched user to show new credits
                    if (searchedUser) {
                        const updatedUser = { ...searchedUser, credits: searchedUser.credits + Number(actionCredits) }
                        setSearchedUser(updatedUser)
                    }
                }
                if (type === 'block' && searchedUser) setSearchedUser({ ...searchedUser, isBlocked: true })
                if (type === 'unblock' && searchedUser) setSearchedUser({ ...searchedUser, isBlocked: false })

                fetchUsers() // Refresh list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setIsActionLoading(false)
        }
    }

    const openUserModal = async (identifier) => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/user/${identifier}`)
            if (data.success) {
                setViewUser(data.user)
            }
        } catch (error) {
            toast.error("Could not fetch user details")
        }
    }

    useEffect(() => {
        if (userData && userData.role === 'admin') {
            fetchData()
            const interval = setInterval(fetchData, 30000)
            return () => clearInterval(interval)
        }
    }, [userData])

    useEffect(() => {
        if (activeTab === 'users') fetchUsers()
    }, [userSearch, userStatusFilter])

    useEffect(() => {
        if (activeTab === 'messages') fetchMessages()
    }, [filters, activeTab])

    if (!userData || userData.role !== 'admin') return <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-main)' }}>Unauthorized</div>

    return (
        <div className='dashboard-container' style={{ maxWidth: '1280px' }}>
            <h1 className='card-title' style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Admin Control Center</h1>

            <div className='stats-grid'>
                <div className='stat-card' style={{ borderBottom: '4px solid var(--primary)' }}>
                    <p className='stat-label'>Total Users</p>
                    <h2 className='stat-value'>{stats.users}</h2>
                </div>
                <div className='stat-card' style={{ borderBottom: '4px solid var(--warning)' }}>
                    <p className='stat-label' style={{ color: 'var(--warning)' }}>Pending Requests</p>
                    <h2 className='stat-value'>{stats.pending}</h2>
                </div>
                <div className='stat-card' style={{ borderBottom: '4px solid var(--error)' }}>
                    <p className='stat-label' style={{ color: 'var(--error)' }}>Blocked Accounts</p>
                    <h2 className='stat-value'>{stats.blocked}</h2>
                </div>
                <div className='stat-card' style={{ borderBottom: '4px solid var(--secondary)' }}>
                    <p className='stat-label' style={{ color: 'var(--secondary)' }}>Messages Sent</p>
                    <h2 className='stat-value'>{stats.totalSms}</h2>
                </div>
            </div>

            <div className='tabs'>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`tab-btn ${activeTab === 'requests' ? 'tab-btn-active' : ''}`}
                >
                    REQUESTS
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`tab-btn ${activeTab === 'users' ? 'tab-btn-active' : ''}`}
                >
                    USERS
                </button>
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`tab-btn ${activeTab === 'actions' ? 'tab-btn-active' : ''}`}
                >
                    ACTIONS
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`tab-btn ${activeTab === 'messages' ? 'tab-btn-active' : ''}`}
                >
                    MESSAGES
                </button>
            </div>

            <div className='card' style={{ padding: '2rem', minHeight: '500px' }}>
                {activeTab === 'requests' && (
                    <div>
                        <h3 className='card-title' style={{ fontSize: '1.25rem' }}>Pending Approval</h3>
                        {pendingRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '5rem' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No pending requests.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                                {pendingRequests.map((req, index) => (
                                    <div key={index} className='card' style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span className={`badge badge-${req.type === 'unblock' ? 'rejected' : 'approved'}`}>
                                                {req.type.toUpperCase()}
                                            </span>
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleString()}</p>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{req.userId?.email}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '1rem 0' }}>Reason: {req.reason}</p>
                                        {req.type === 'credit' && <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>+ {req.amount} Credits</p>}

                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button onClick={() => handleRequest(req._id, 'approved')} className='btn-submit' style={{ background: 'var(--success)', padding: '0.5rem', fontSize: '0.75rem' }}>APPROVE</button>
                                            <button onClick={() => handleRequest(req._id, 'rejected')} className='btn-submit' style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '0.5rem', fontSize: '0.75rem', border: '1px solid var(--border)', boxShadow: 'none' }}>REJECT</button>
                                            <button onClick={() => openUserModal(req.userId._id)} className='btn-submit' style={{ background: 'var(--primary)', padding: '0.5rem', fontSize: '0.75rem' }}>VIEW USER</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <input
                                type="text"
                                className='form-input'
                                placeholder='Filter by email or ID...'
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                            <select
                                className='form-input'
                                style={{ width: '200px' }}
                                value={userStatusFilter}
                                onChange={(e) => setUserStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div className='table-container'>
                            <table className='admin-table'>
                                <thead>
                                    <tr>
                                        <th>User Identity</th>
                                        <th>Credits</th>
                                        <th>Status</th>
                                        <th>Joined At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((user, index) => (
                                        <tr key={index}>
                                            <td>
                                                <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user.email}</p>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {user._id}</span>
                                            </td>
                                            <td>{user.credits}</td>
                                            <td>
                                                <span className={`badge badge-${user.isBlocked ? 'rejected' : 'approved'}`}>
                                                    {user.isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => performAction(user.isBlocked ? 'unblock' : 'block', user._id)}
                                                        className='btn-submit'
                                                        style={{ background: user.isBlocked ? 'var(--success)' : 'var(--error)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                                                    >
                                                        {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                                                    </button>
                                                    <button onClick={() => openUserModal(user._id)} className='btn-submit' style={{ background: 'var(--primary)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}>
                                                        VIEW
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3 className='card-title' style={{ marginBottom: '2rem' }}>Administrative Actions</h3>

                        <div className='card' style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', marginBottom: '2rem' }}>
                            <label className='form-label'>Search User to Manage</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className='form-input'
                                    placeholder='Enter User Email or ID'
                                    value={actionEmail}
                                    onChange={(e) => setActionEmail(e.target.value)}
                                />
                                <button
                                    onClick={searchUserForAction}
                                    disabled={isActionLoading}
                                    className='btn-submit'
                                    style={{ width: '150px' }}
                                >
                                    SEARCH
                                </button>
                            </div>
                        </div>

                        {searchedUser && (
                            <div className='card' style={{ backgroundColor: '#1e293b', padding: '2rem', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>User Details</h4>
                                        <p><strong>Email:</strong> {searchedUser.email}</p>
                                        <p><strong>ID:</strong> {searchedUser._id}</p>
                                        <p><strong>Credits:</strong> {searchedUser.credits}</p>
                                        <p><strong>Status:</strong> <span className={`badge badge-${searchedUser.isBlocked ? 'rejected' : 'approved'}`}>{searchedUser.isBlocked ? 'BLOCKED' : 'ACTIVE'}</span></p>
                                        <p><strong>Joined:</strong> {new Date(searchedUser.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className='action-group'>
                                            <h5 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Account Status</h5>
                                            <button
                                                onClick={() => performAction(searchedUser.isBlocked ? 'unblock' : 'block')}
                                                disabled={isActionLoading}
                                                className='btn-submit'
                                                style={{ background: searchedUser.isBlocked ? 'var(--success)' : 'var(--error)' }}
                                            >
                                                {searchedUser.isBlocked ? 'UNBLOCK USER' : 'BLOCK USER'}
                                            </button>
                                        </div>

                                        <div className='action-group'>
                                            <h5 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Manage Credits</h5>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    className='form-input'
                                                    placeholder='Amount'
                                                    value={actionCredits}
                                                    onChange={(e) => setActionCredits(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => performAction('addCredits')}
                                                    disabled={isActionLoading}
                                                    className='btn-submit'
                                                >
                                                    ADD
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                className='form-input'
                                style={{ flex: 1 }}
                                placeholder='Search User Email...'
                                value={filters.email}
                                onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <select
                                className='form-input'
                                style={{ width: '150px' }}
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">All Status</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                            </select>
                            <input
                                type="date"
                                className='form-input'
                                style={{ width: '200px' }}
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            />
                            <button
                                onClick={() => setFilters({ email: '', status: '', date: '' })}
                                className='btn-submit'
                                style={{ width: 'auto', padding: '0.75rem 1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                            >
                                RESET
                            </button>
                        </div>

                        <div className='table-container'>
                            <table className='admin-table'>
                                <thead>
                                    <tr>
                                        <th>Recipient</th>
                                        <th>Message Snippet</th>
                                        <th>Status</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allSms.map((msg, index) => (
                                        <tr key={index}>
                                            <td style={{ color: 'var(--text-main)' }}>{msg.to}</td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</td>
                                            <td>
                                                <span className={`badge badge-${msg.status === 'sent' ? 'approved' : 'rejected'}`}>
                                                    {msg.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {viewUser && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setViewUser(null)}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '2.5rem',
                        borderRadius: '1rem',
                        width: '90%',
                        maxWidth: '500px',
                        position: 'relative',
                        border: '1px solid var(--border)'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setViewUser(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>User Profile</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                                <span style={{ fontWeight: 600 }}>{viewUser._id}</span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                                <span style={{ fontWeight: 600 }}>{viewUser.email}</span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Credits Balance:</span>
                                <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--secondary)' }}>{viewUser.credits}</span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Account Status:</span>
                                <span className={`badge badge-${viewUser.isBlocked ? 'rejected' : 'approved'}`}>
                                    {viewUser.isBlocked ? 'Blocked' : 'Active'}
                                </span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Verified:</span>
                                <span>{viewUser.isVerified ? '✅ Yes' : '❌ No'}</span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>API Key:</span>
                                <code style={{ backgroundColor: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{viewUser.apiKey || 'N/A'}</code>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                                <span style={{ textTransform: 'capitalize' }}>{viewUser.role}</span>
                            </div>
                            <div className='detail-row'>
                                <span style={{ color: 'var(--text-muted)' }}>Joined Date:</span>
                                <span>{new Date(viewUser.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    performAction(viewUser.isBlocked ? 'unblock' : 'block', viewUser._id);
                                    setViewUser(prev => ({ ...prev, isBlocked: !prev.isBlocked })); // Optimistic update
                                }}
                                className='btn-submit'
                                style={{ background: viewUser.isBlocked ? 'var(--success)' : 'var(--error)' }}
                            >
                                {viewUser.isBlocked ? 'Unblock User' : 'Block User'}
                            </button>
                            <button
                                onClick={() => setViewUser(null)}
                                className='btn-submit'
                                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
