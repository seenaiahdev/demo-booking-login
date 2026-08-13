// Purpose: Main AspireNext application shell managing URL routing, user authentication, Supabase completion persistence routing directly to Success page upon re-login, and logout security guards.

import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import SuccessPage from './components/SuccessPage';
import AdminDashboard from './components/AdminDashboard';
import { fetchProgressFromBackend, syncProgressWithBackend } from './utils/storage';
import { PlayCircle, Clock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = window.localStorage.getItem('demoLoginCurrentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      if (window.location.search.includes('admin=true')) return 'admin';
      const storedUser = window.localStorage.getItem('demoLoginCurrentUser');
      if (!storedUser) return 'login';
      const path = window.location.pathname;
      if (path === '/success') return 'success';
      if (path === '/home') return 'home';
      return 'home';
    } catch (e) {
      return 'login';
    }
  });

  const [savedProgress, setSavedProgress] = useState({ currentTime: 0, completed: false });
  const [videoDuration, setVideoDuration] = useState(0);

  // Sync user watch progress directly from Supabase backend
  useEffect(() => {
    if (currentUser?.id) {
      fetchProgressFromBackend(currentUser.id).then((progress) => {
        setSavedProgress(progress);
        if (progress.completed) {
          setCurrentUser((prev) => (prev ? { ...prev, completed: true } : prev));
          setCurrentView('success');
          if (window.location.pathname !== '/success') {
            window.history.replaceState(null, '', '/success');
          }
        } else {
          setCurrentView('home');
          if (window.location.pathname !== '/home') {
            window.history.replaceState(null, '', '/home');
          }
        }
      });
    }
  }, [currentUser?.id]);

  // Update browser tab title dynamically based on active view
  useEffect(() => {
    if (currentView === 'login' || !currentUser) {
      document.title = 'AspireNext | Portal Sign In';
    } else if (currentView === 'success') {
      document.title = 'AspireNext | Training Completed';
    } else {
      document.title = 'AspireNext | Video Training Session';
    }
  }, [currentView, currentUser]);

  // Strict Logout & History Security Guard (Prevents Back/Forward navigation into protected views post-logout)
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/login');
      }

      const handlePopState = () => {
        window.history.pushState(null, '', '/login');
        setCurrentView('login');
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [currentUser]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    window.localStorage.setItem('demoLoginCurrentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSavedProgress({ currentTime: 0, completed: false });
    window.localStorage.removeItem('demoLoginCurrentUser');
    window.history.replaceState(null, '', '/login');
  };

  const handleVideoCompleted = () => {
    if (currentUser?.id) {
      syncProgressWithBackend(currentUser, savedProgress.currentTime || 0, true);
    }
    const updatedUser = { ...currentUser, completed: true };
    setCurrentUser(updatedUser);
    setSavedProgress((prev) => ({ ...prev, completed: true }));

    // Route directly to Success Page view and update URL to /success
    setCurrentView('success');
    window.history.pushState(null, '', '/success');
  };

  const completionPercentage = savedProgress.completed
    ? 100
    : videoDuration > 0
    ? Math.min(99, Math.floor(((savedProgress.currentTime || 0) / videoDuration) * 100))
    : 0;

  const handleAdminLogout = () => {
    setCurrentView('login');
    window.history.replaceState(null, '', '/');
  };

  if (currentView === 'admin') {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  if (currentView === 'login' || (!currentUser && currentView !== 'admin')) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {currentView === 'success' ? (
        <SuccessPage user={currentUser} onLogout={handleLogout} />
      ) : (
        <>
          <Header
            user={currentUser}
            onLogout={handleLogout}
          />

          <main className="dashboard-container-aspire">
            <div className="dashboard-grid-layout">
              {/* Main Video Theater Section */}
              <div className="theater-main-column">
                <div className="dashboard-title-box" style={{ marginBottom: '1rem' }}>
                  <h1 className="dashboard-main-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <PlayCircle size={26} color="#38bdf8" /> Course Demo Video
                  </h1>
                </div>

                <VideoPlayer
                  user={currentUser}
                  savedProgress={savedProgress}
                  onComplete={handleVideoCompleted}
                  onDurationChange={setVideoDuration}
                  onProgressUpdate={(time) => setSavedProgress(prev => ({ ...prev, currentTime: time }))}
                />
              </div>

              {/* Sidebar Course & Session Stats Card */}
              <aside className="sidebar-stats-column">
                <div className="glass-sidebar-card">
                  <h3 className="sidebar-card-title">Session Progress</h3>

                  <div className="progress-gauge-box">
                    <div className="gauge-text-number">
                      {savedProgress.completed ? '100%' : `${completionPercentage}%`}
                    </div>
                    <div className="gauge-label">
                      {savedProgress.completed ? 'Training Completed' : 'Session Watch Status'}
                    </div>
                    <div className="gauge-bar-track">
                      <div
                        className="gauge-bar-fill"
                        style={{ width: `${savedProgress.completed ? 100 : completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="stats-list">
                    <div className="stat-item">
                      <Clock size={18} className="stat-icon" />
                      <div>
                        <div className="stat-label">Saved Resume Time</div>
                        <div className="stat-val">
                          {(() => {
                            const rawSeconds = Math.floor(savedProgress.currentTime || 0);
                            const h = Math.floor(rawSeconds / 3600);
                            const m = Math.floor((rawSeconds % 3600) / 60);
                            const s = rawSeconds % 60;
                            return h > 0
                              ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                              : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <ShieldCheck size={18} className="stat-icon" />
                      <div>
                        <div className="stat-label">Security Guard</div>
                        <div className="stat-val" style={{ color: '#34d399' }}>Active</div>
                      </div>
                    </div>

                  </div>
                </div>
              </aside>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
