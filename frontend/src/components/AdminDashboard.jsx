import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/lazy';
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
  const [controls, setControls] = useState({
    playPause: true,
    volume: true,
    fullscreen: true,
    allowSkip: false
  });

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
      if (data.success) {
        if (data.videoId) setVideoId(data.videoId);
        if (data.controls) setControls(data.controls);
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
        body: JSON.stringify({ password, videoId, controls })
      });
      const data = await res.json();
      if (data.success) {
        setVideoConfigMsg('Global config updated successfully!');
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
      <div className="login-page-3d-wrapper">
        <div className="glass-login-card-3d">
          <div className="card-brand-header" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div className="brand-logo-badge" style={{ backgroundColor: '#f43f5e', padding: '12px', borderRadius: '50%' }}>
              <ShieldCheck size={36} color="white" />
            </div>
          </div>
          <div className="form-header">
            <h1 className="form-title" style={{ textAlign: 'center' }}>Admin Portal</h1>
            <p className="form-subtitle" style={{ textAlign: 'center' }}>
              Enter the master password to proceed
            </p>
          </div>
          
          {error && (
            <div className="alert-error-aspire">
              <ShieldCheck size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group-aspire">
              <label className="form-label-aspire">
                Master Password<span>*</span>
              </label>
              <div className="input-wrapper-aspire">
                <ShieldCheck className="input-icon-aspire" size={16} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-aspire"
                  autoFocus
                />
              </div>
            </div>
            
            <button type="submit" className="btn-aspire-primary" style={{ width: '100%', background: '#f43f5e', border: 'none', color: 'white', display: 'flex', justifyContent: 'center' }}>
              Authenticate
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={onLogout} className="btn-logout-aspire" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>Back to User Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: '#0f172a' }}>
      <nav className="top-nav" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontWeight: 'bold', fontSize: '1.25rem' }}>
          <div style={{ backgroundColor: '#f43f5e', padding: '8px', borderRadius: '8px', display: 'flex' }}><ShieldCheck size={20} color="white" /></div>
          <span>AspireNext Admin</span>
        </div>
        <button onClick={onLogout} className="btn-logout-aspire" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
          <LogOut size={18} /> Exit Admin
        </button>
      </nav>

      <main className="main-content" style={{ padding: '2rem' }}>
        {/* Video Configuration Section */}
        <div className="glass-sidebar-card" style={{ marginBottom: '2rem', maxWidth: '800px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e2e8f0' }}>
            <Play size={24} color="#f43f5e"/> Global Video Configuration
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.25rem' }}>Enter a YouTube Video ID or full YouTube URL to update the video for all users globally.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="form-group-aspire" style={{ flex: 1, margin: 0, width: '100%' }}>
              <div className="input-wrapper-aspire" style={{ width: '100%' }}>
                <Play className="input-icon-aspire" size={16} />
                <input 
                  className="input-aspire" 
                  value={videoId} 
                  onChange={e => {
                    let val = e.target.value.trim();
                    // If it's exactly 11 characters without slashes/dots, assume it's a raw YouTube ID
                    if (val.length === 11 && !val.includes('/') && !val.includes('.')) {
                      val = `https://www.youtube.com/watch?v=${val}`;
                    }
                    setVideoId(val);
                  }}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or https://.../video.mp4"
                  style={{ width: '100%', margin: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#f8fafc', borderColor: '#334155' }}
                />
              </div>
            </div>
            <button onClick={updateVideoId} className="btn-aspire-primary" style={{ background: '#f43f5e', border: 'none', height: '42px', padding: '0 1.5rem', borderRadius: '8px', whiteSpace: 'nowrap', width: 'auto' }}>Update Config</button>
          </div>
          {videoConfigMsg && <div style={{ marginTop: '1rem', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16}/> {videoConfigMsg}</div>}
          
          <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '2rem 0' }} />

          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>User Playback Permissions</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Toggle which controls the users are allowed to use during playback.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ color: '#e2e8f0' }}>Play/Pause</span>
              <label className="toggle-switch-aspire">
                <input type="checkbox" checked={controls.playPause} onChange={e => setControls({...controls, playPause: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ color: '#e2e8f0' }}>Volume Control</span>
              <label className="toggle-switch-aspire">
                <input type="checkbox" checked={controls.volume} onChange={e => setControls({...controls, volume: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ color: '#e2e8f0' }}>Fullscreen</span>
              <label className="toggle-switch-aspire">
                <input type="checkbox" checked={controls.fullscreen} onChange={e => setControls({...controls, fullscreen: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ color: '#e2e8f0' }}>Allow Skipping (Anti-Cheat)</span>
              <label className="toggle-switch-aspire">
                <input type="checkbox" checked={controls.allowSkip} onChange={e => setControls({...controls, allowSkip: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {/* Video Preview */}
          {videoId && (
            <div style={{ marginTop: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', backgroundColor: '#000' }}>
              <ReactPlayer 
                url={videoId} 
                width="100%" 
                height="240px" 
                controls={true} 
              />
            </div>
          )}
        </div>

        {/* User Progress Table */}
        <div className="glass-sidebar-card" style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#e2e8f0', margin: 0 }}>User Watch Progress</h2>
            <button onClick={() => fetchData()} className="btn-logout-aspire" disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid #334155', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group-aspire" style={{ flex: 1, margin: 0 }}>
              <div className="input-wrapper-aspire">
                <Search className="input-icon-aspire" size={16} />
                <input 
                  className="input-aspire" 
                  placeholder="Search by name or ID..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#f8fafc', borderColor: '#334155' }}
                />
              </div>
            </div>
            <div className="form-group-aspire" style={{ width: '200px', margin: 0 }}>
              <div className="input-wrapper-aspire" style={{ padding: 0 }}>
                <select 
                  className="input-aspire" 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)} 
                  style={{ paddingLeft: '1rem', appearance: 'none', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#f8fafc', borderColor: '#334155' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>
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
