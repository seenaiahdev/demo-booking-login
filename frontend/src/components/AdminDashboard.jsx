import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, RefreshCw, Search, Filter, Play, CheckCircle, Clock } from 'lucide-react';
import '../index.css';

export default function AdminDashboard({ onLogout }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [videoId, setVideoId] = useState('');
  const [videoConfigMsg, setVideoConfigMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setError('');
        fetchData(password);
        fetchVideoConfig();
      } else {
        setError('Invalid admin password');
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const fetchData = async (pwd = password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'x-admin-password': pwd }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchVideoConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/video-config`);
      const data = await res.json();
      if (data.success && data.videoId) {
        setVideoId(data.videoId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateVideoId = async () => {
    setVideoConfigMsg('Updating...');
    try {
      const res = await fetch(`${API_BASE}/video-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, videoId })
      });
      const data = await res.json();
      if (data.success) {
        setVideoConfigMsg('Global video updated successfully!');
        setTimeout(() => setVideoConfigMsg(''), 3000);
      } else {
        setVideoConfigMsg('Failed to update video');
      }
    } catch (err) {
      setVideoConfigMsg('Error updating video');
    }
  };

  const resetProgress = async (user) => {
    if (!window.confirm(`Reset progress for ${user.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reset-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          user_id: user.user_id,
          registration_id: user.registration_id,
          name: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh list
      } else {
        alert('Failed to reset progress');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.registration_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'COMPLETED' && u.completed) || 
                          (statusFilter === 'IN_PROGRESS' && !u.completed);
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: '400px' }}>
          <div className="login-header">
            <div className="logo-placeholder" style={{ backgroundColor: '#f43f5e' }}>
              <ShieldCheck size={28} color="white" />
            </div>
            <h2>Admin Portal</h2>
            <p>Enter the master password to proceed</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Master Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="input-field"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#f43f5e', border: 'none' }}>
              Authenticate
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={onLogout} className="btn" style={{ background: 'transparent', border: '1px solid #334155' }}>Back to User Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-layout">
      <nav className="top-nav">
        <div className="nav-logo">
          <div className="logo-placeholder" style={{ backgroundColor: '#f43f5e' }}><ShieldCheck size={24} color="white" /></div>
          <span>AspireNext Admin</span>
        </div>
        <button onClick={onLogout} className="btn btn-outline">
          <LogOut size={18} /> Exit Admin
        </button>
      </nav>

      <main className="main-content" style={{ padding: '2rem' }}>
        
        {/* Video Configuration Section */}
        <div className="glass-sidebar-card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e2e8f0' }}>
            <Play size={24} color="#f43f5e"/> Global Video Configuration
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Enter a YouTube Video ID to change the video for all users globally. (e.g. 8KCuHHeC_M0)</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              className="input-field" 
              value={videoId} 
              onChange={e => setVideoId(e.target.value)}
              placeholder="YouTube Video ID"
              style={{ flex: 1, margin: 0 }}
            />
            <button onClick={updateVideoId} className="btn btn-primary" style={{ background: '#f43f5e', border: 'none' }}>Update Global Video</button>
          </div>
          {videoConfigMsg && <div style={{ marginTop: '1rem', color: '#34d399' }}>{videoConfigMsg}</div>}
          
          {/* YouTube Preview */}
          {videoId && (
            <div style={{ marginTop: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
              <iframe 
                width="100%" 
                height="200" 
                src={`https://www.youtube.com/embed/${videoId}?controls=1`} 
                title="YouTube Preview"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* User Progress Table */}
        <div className="glass-sidebar-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#e2e8f0' }}>User Watch Progress</h2>
            <button onClick={() => fetchData()} className="btn btn-outline" disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ flex: 1, margin: 0, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                className="input-field" 
                placeholder="Search by name or ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', margin: 0 }}
              />
            </div>
            <div className="input-group" style={{ width: '200px', margin: 0 }}>
              <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#e2e8f0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Registration ID</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Progress</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.user_id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace' }}>{user.registration_id}</td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="#38bdf8"/> {user.watched_timestamp}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {user.completed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}>
                          <CheckCircle size={14} /> Completed
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}>
                          <Play size={14} /> In Progress
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => resetProgress(user)}
                        className="btn btn-outline" 
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderColor: '#f43f5e', color: '#f43f5e' }}
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
