import React, { useState, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player/lazy';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, LogOut, RefreshCw, Search, Filter, Play, CheckCircle, 
  Clock, Download, ArrowUp, ArrowDown, Users, TrendingUp, Sliders, 
  Video, Monitor, Sparkles, Lock, Volume2, Maximize, AlertOctagon, UserCheck, Layers, Settings, Eye, EyeOff, Columns, ChevronDown
} from 'lucide-react';
import ThreeBackground from './ThreeBackground';
import logoImg from '../assests/Logo_f8hqc0.jpg';
import { YouTubeSVG } from './AspireLogo';
import '../index.css';

export default function AdminDashboard({ onLogout }) {
  const [password, setPassword] = useState(() => sessionStorage.getItem('adminPwd') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuth') === 'true');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('VIDEO'); // 'VIDEO', 'STUDENTS'
  const allColumns = ['registration_id', 'name', 'current_time', 'completed', 'actions'];
  const [visibleColumns, setVisibleColumns] = useState(new Set(allColumns));
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  
  const toggleColumn = (column) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) newSet.delete(column);
      else newSet.add(column);
      return newSet;
    });
  };

  // Data filtering and sorting logic
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" }
    }),
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'registration_id', direction: 'asc' });

  // Video Config State
  const [videoId, setVideoId] = useState('');
  const [controls, setControls] = useState({
    playPause: true,
    volume: true,
    fullscreen: true,
    allowSkip: false
  });
  const [videoConfigMsg, setVideoConfigMsg] = useState('');

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

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
        setVideoConfigMsg('Global configuration updated successfully!');
        setTimeout(() => setVideoConfigMsg(''), 3000);
      } else {
        setVideoConfigMsg('Failed to update configuration.');
      }
    } catch (err) {
      setVideoConfigMsg('Error connecting to server.');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetchVideoConfig();
    }
  }, [isAuthenticated]);

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
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminPwd', password);
        setError('');
        fetchData(password);
        fetchVideoConfig();
      } else {
        setError('Invalid admin password');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const resetProgress = async (user) => {
    if (!window.confirm(`Reset progress for ${user.name}? This action cannot be undone.`)) return;
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
        fetchData();
      } else {
        alert('Failed to reset progress');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const exportToCSV = () => {
    const headers = ['Registration ID', 'Name', 'Email', 'Mobile', 'Progress Time (s)', 'Progress Time (Formatted)', 'Completed'];
    const rows = sortedUsers.map(u => [
      u.registration_id || '',
      u.name || '',
      u.email || '',
      u.mbnum || '',
      u.current_time || 0,
      u.watched_timestamp || '00:00',
      u.completed ? 'YES' : 'NO'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aspirenext_progress_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (user.user_id === 'SYSTEM_CONFIG' || user.name === 'SYSTEM_CONFIG' || user.registration_id === 'SYSTEM') return false;

      const matchesSearch = 
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.registration_id || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      if (statusFilter === 'COMPLETED') return matchesSearch && user.completed;
      if (statusFilter === 'IN_PROGRESS') return matchesSearch && !user.completed;
      return matchesSearch;
    });
  }, [users, searchTerm, statusFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  // Analytics
  const totalStudents = users.length;
  const completedStudents = users.filter(u => u.completed).length;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

  const handleAdminExit = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminPwd');
    onLogout();
  };

  if (!isAuthenticated) {
    return (
      <div className="login-page-3d-wrapper">
        <ThreeBackground />
        <div className="glass-login-card-3d" style={{ maxWidth: '440px' }}>
          <div className="card-brand-header" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src={logoImg} alt="Aspire Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="form-header">
            <h1 className="form-title" style={{ textAlign: 'center', fontSize: '1.8rem', background: 'linear-gradient(135deg, #1e293b, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Control Portal
            </h1>
            <p className="form-subtitle" style={{ textAlign: 'center' }}>
              Authenticate with master password to access system management
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
                <Lock className="input-icon-aspire" size={16} color="#2563eb" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-aspire"
                  style={{ paddingRight: '2.8rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.9rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-aspire-primary" style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '1rem', fontWeight: '700' }}>
              Authenticate & Enter
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button onClick={onLogout} className="btn-logout-aspire" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem' }}>
              ← Back to User Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.12) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.08) 0%, transparent 40%), #0b0f19' }}>
      {/* Top Bar Header */}
      <nav className="top-nav" style={{ padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <img src={logoImg} alt="Aspire Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#f8fafc', fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AspireNext
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.2)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* 2 Clean Dashboard Tab Controls */}
        <div className="admin-tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            className={`admin-tab-btn ${activeTab === 'VIDEO' ? 'active' : ''}`}
            onClick={() => setActiveTab('VIDEO')}
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Video size={16} /> Video Management
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'STUDENTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('STUDENTS')}
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Users size={16} /> Student Analytics
          </button>
        </div>

        {/* Right Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: '20px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34d399', fontSize: '0.75rem', fontWeight: '600' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></span> System Live
          </div>
          <button onClick={handleAdminExit} className="btn-logout-aspire" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 99, 235, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.55rem 1.2rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <LogOut size={16} /> Exit Admin
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" style={{ padding: '2.5rem', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* DASHBOARD 1: VIDEO MANAGEMENT DASHBOARD */}
        {activeTab === 'VIDEO' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                 Video Management Dashboard
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                Control active global video content, set platform links, and configure student anti-cheat restrictions.
              </p>
            </div>

            <div className="dashboard-grid-cards">
              
              {/* Left Column: Video Link Manager & Restrictions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Card A: Video URL Config */}
                <div className="admin-card-glass">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex' }}>
                      <Video size={22} color="#38bdf8"/>
                    </div>
                    <div>
                      <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Video Link Configuration</h2>
                      <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>Paste any video platform URL or direct media link</p>
                    </div>
                  </div>



                  <div className="admin-input-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="form-group-aspire" style={{ flex: 1, margin: 0 }}>
                      <div className="input-wrapper-aspire" style={{ width: '100%' }}>
                        <Play className="input-icon-aspire" size={16} color="#38bdf8" />
                        <input 
                          className="input-aspire" 
                          value={videoId} 
                          onChange={e => setVideoId(e.target.value)}
                          placeholder="Paste video URL"
                          style={{ width: '100%', margin: 0, backgroundColor: 'rgba(11, 15, 25, 0.7)', color: '#f8fafc', borderColor: 'rgba(56, 189, 248, 0.25)', paddingLeft: '2.5rem', borderRadius: '12px', fontSize: '0.9rem', minWidth: 0 }}
                        />
                      </div>
                    </div>
                    <button onClick={updateVideoId} className="btn-aspire-primary" style={{ height: '46px', padding: '0 1.6rem', borderRadius: '12px', whiteSpace: 'nowrap', width: 'auto', fontWeight: '700', fontSize: '0.9rem' }}>
                      Update Video
                    </button>
                  </div>

                  {videoConfigMsg && (
                    <div style={{ marginTop: '1rem', color: '#34d399', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                      <CheckCircle size={16}/> {videoConfigMsg}
                    </div>
                  )}
                </div>

                {/* Card B: Interactive Restrictions & Anti-Cheat */}
                <div className="admin-card-glass">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex' }}>
                      <Sliders size={22} color="#06b6d4"/>
                    </div>
                    <div>
                      <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Student Playback Restrictions</h2>
                      <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>Toggle permitted user interactive features during playback</p>
                    </div>
                  </div>

                  <div className="admin-toggles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {/* Option 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11, 15, 25, 0.6)', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                        <Play size={15} color="#38bdf8" /> Play / Pause
                      </div>
                      <label className="toggle-switch-aspire">
                        <input type="checkbox" checked={controls.playPause} onChange={e => setControls({...controls, playPause: e.target.checked})} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {/* Option 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11, 15, 25, 0.6)', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                        <Volume2 size={15} color="#38bdf8" /> Volume
                      </div>
                      <label className="toggle-switch-aspire">
                        <input type="checkbox" checked={controls.volume} onChange={e => setControls({...controls, volume: e.target.checked})} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {/* Option 3 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11, 15, 25, 0.6)', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                        <Maximize size={15} color="#38bdf8" /> Fullscreen
                      </div>
                      <label className="toggle-switch-aspire">
                        <input type="checkbox" checked={controls.fullscreen} onChange={e => setControls({...controls, fullscreen: e.target.checked})} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {/* Option 4 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11, 15, 25, 0.6)', padding: '1rem 1.1rem', borderRadius: '14px', border: controls.allowSkip ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: controls.allowSkip ? '#e2e8f0' : '#f87171', fontSize: '0.875rem', fontWeight: '600' }}>
                        <AlertOctagon size={15} color={controls.allowSkip ? '#38bdf8' : '#f87171'} /> Seek Skip
                      </div>
                      <label className="toggle-switch-aspire">
                        <input type="checkbox" checked={controls.allowSkip} onChange={e => setControls({...controls, allowSkip: e.target.checked})} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {!controls.allowSkip && (
                    <div style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 14px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <ShieldCheck size={16} /> Anti-Cheat Seek Lock is ENABLED (Students cannot forward skip)
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Clean Monitor Stream Preview */}
              <div className="admin-card-glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.15)', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex' }}>
                      <Monitor size={20} color="#34d399"/>
                    </div>
                    <div>
                      <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Live Stream Monitor</h2>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Clean live player monitor preview</span>
                    </div>
                  </div>
                  
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: '700' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }}></span> STREAM READY
                  </span>
                </div>

                {/* Video URL Display Badge */}
                <div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(11, 15, 25, 0.8)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  🔗 Active Stream: {videoId || 'No video loaded'}
                </div>

                {/* 16:9 Clean Aspect Ratio Player Container */}
                <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.3)', backgroundColor: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {videoId ? (
                    <ReactPlayer 
                      url={videoId} 
                      width="100%" 
                      height="100%" 
                      controls={true} 
                    />
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Paste a video URL to initiate monitor stream</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DASHBOARD 2: STUDENT ANALYTICS DASHBOARD */}
        {activeTab === 'STUDENTS' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                📊 Student Analytics & Progress Dashboard
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                Real-time student progress tracking synchronized with Supabase & Google Sheets.
              </p>
            </div>

            {/* Top Metric Stats Cards */}
            <div className="dashboard-metrics-grid">
              {/* Metric 1 */}
              <div className="admin-card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(56, 189, 248, 0.1))', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex' }}>
                  <Users size={28} color="#38bdf8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Enrolled</div>
                  <div style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: '800', marginTop: '2px', lineHeight: 1 }}>{totalStudents}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px' }}>Active video course learners</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="admin-card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.1))', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex' }}>
                  <CheckCircle size={28} color="#34d399" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                  <div style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: '800', marginTop: '2px', lineHeight: 1 }}>{completedStudents}</div>
                  <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>Finished 100% course video</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="admin-card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(56, 189, 248, 0.1))', borderRadius: '16px', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex' }}>
                  <TrendingUp size={28} color="#06b6d4" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</div>
                  <div style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: '800', marginTop: '2px', lineHeight: 1 }}>{completionRate}%</div>
                  <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #34d399)', borderRadius: '2px' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Table Glass Card */}
            <div className="admin-card-glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.35rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <UserCheck size={24} color="#38bdf8"/> Student Watch Progress Roster
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => fetchData()} className="admin-tab-btn" disabled={loading}>
                    <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Roster
                  </button>
                  <button onClick={exportToCSV} className="btn-aspire-primary" style={{ background: 'rgba(37, 99, 235, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', height: 'auto', width: 'auto', margin: 0, fontWeight: '700', cursor: 'pointer' }}>
                    <Download size={16} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <div className="form-group-aspire" style={{ flex: 1, margin: 0, minWidth: '260px' }}>
                  <div className="input-wrapper-aspire">
                    <Search className="input-icon-aspire" size={16} color="#38bdf8" />
                    <input 
                      className="input-aspire" 
                      placeholder="Search by student name or registration ID..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ backgroundColor: 'rgba(11, 15, 25, 0.7)', color: '#f8fafc', borderColor: 'rgba(56, 189, 248, 0.2)', paddingLeft: '2.5rem', borderRadius: '12px' }}
                    />
                  </div>
                </div>
                <div className="form-group-aspire" style={{ width: '200px', margin: 0 }}>
                  <div className="input-wrapper-aspire" style={{ padding: 0 }}>
                    <select 
                      className="input-aspire" 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)} 
                      style={{ paddingLeft: '1rem', appearance: 'none', backgroundColor: 'rgba(11, 15, 25, 0.7)', color: '#f8fafc', borderColor: 'rgba(56, 189, 248, 0.2)', borderRadius: '12px' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                    className="btn-aspire-primary" 
                    style={{ background: 'rgba(11, 15, 25, 0.7)', color: '#f8fafc', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', height: '46px', margin: 0, fontWeight: '600', cursor: 'pointer' }}
                  >
                    <Columns size={16} color="#38bdf8" /> Columns <ChevronDown size={14} />
                  </button>
                  {isColumnDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'rgba(11, 15, 25, 0.95)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '0.5rem', zIndex: 50, minWidth: '170px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                      {[
                        { key: 'registration_id', label: 'Reg ID' },
                        { key: 'name', label: 'Student Name' },
                        { key: 'current_time', label: 'Watch Time' },
                        { key: 'completed', label: 'Status' },
                        { key: 'actions', label: 'Actions' }
                      ].map(col => (
                        <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', color: '#e2e8f0', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem' }} className="admin-tab-btn">
                          <input 
                            type="checkbox" 
                            checked={visibleColumns.has(col.key)} 
                            onChange={() => toggleColumn(col.key)} 
                            style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#e2e8f0', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(11, 15, 25, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      {visibleColumns.has('registration_id') && (
                        <th style={{ padding: '1.2rem 1.25rem', cursor: 'pointer' }} onClick={() => handleSort('registration_id')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Reg ID {sortConfig.key === 'registration_id' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                      )}
                      {visibleColumns.has('name') && (
                        <th style={{ padding: '1.2rem 1.25rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Student Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                      )}
                      {visibleColumns.has('current_time') && (
                        <th style={{ padding: '1.2rem 1.25rem', cursor: 'pointer' }} onClick={() => handleSort('current_time')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Watch Time {sortConfig.key === 'current_time' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                      )}
                      {visibleColumns.has('completed') && (
                        <th style={{ padding: '1.2rem 1.25rem', cursor: 'pointer' }} onClick={() => handleSort('completed')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Status {sortConfig.key === 'completed' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                      )}
                      {visibleColumns.has('actions') && (
                        <th style={{ padding: '1.2rem 1.25rem', textAlign: 'right' }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sortedUsers.length === 0 ? (
                        <tr><td colSpan={visibleColumns.size} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No active student progress records found</td></tr>
                      ) : sortedUsers.map((user, index) => (
                        <motion.tr 
                          key={user.user_id} 
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={rowVariants}
                          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}
                          className="hover-bg-glass"
                        >
                          {visibleColumns.has('registration_id') && (
                            <td style={{ padding: '1.1rem 1.25rem' }}>
                              <span style={{ fontFamily: 'monospace', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.85rem' }}>
                                {user.registration_id}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('name') && (
                            <td style={{ padding: '1.1rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                                  {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#f8fafc' }}>{user.name}</div>
                                  {user.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('current_time') && (
                            <td style={{ padding: '1.1rem 1.25rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                <Clock size={14} color="#38bdf8"/> {user.watched_timestamp}
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('completed') && (
                            <td style={{ padding: '1.1rem 1.25rem' }}>
                              {user.completed ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', background: '#22c55e', padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(34, 197, 94, 0.5)', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)' }}>
                                  <CheckCircle size={14} /> Completed
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', background: '#eab308', padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(234, 179, 8, 0.5)', boxShadow: '0 4px 12px rgba(234, 179, 8, 0.25)' }}>
                                  <Play size={14} /> In Progress
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has('actions') && (
                            <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                              <button 
                                onClick={() => resetProgress(user)}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', color: '#f87171', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: '600', transition: 'all 0.2s ease' }}
                              >
                                Reset
                              </button>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
