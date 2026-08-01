// Purpose: Main AspireNext application shell managing URL routing, user authentication, Supabase completion persistence routing directly to Success page upon re-login, and logout security guards.

import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import SuccessPage from './components/SuccessPage';
import { fetchProgressFromBackend, syncProgressWithBackend } from './utils/storage';
import { PlayCircle, Clock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [savedProgress, setSavedProgress] = useState({ currentTime: 0, completed: false });
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const storedUser = window.localStorage.getItem('demoLoginCurrentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        window.localStorage.removeItem('demoLoginCurrentUser');
      }
    }
  }, []);

  // Sync user watch progress directly from Supabase backend
  useEffect(() => {
    if (currentUser?.id) {
      fetchProgressFromBackend(currentUser.id).then((progress) => {
        setSavedProgress(progress);
        if (progress.completed) {
          setCurrentUser((prev) => (prev ? { ...prev, completed: true } : prev));
          setCurrentView('success');
          window.history.replaceState(null, '', '/success');
        } else {
          setCurrentView('home');
          window.history.replaceState(null, '', '/home');
        }
      });
    }
  }, [currentUser?.id]);

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
      syncProgressWithBackend(currentUser.id, savedProgress.currentTime || 0, true);
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

  return (
    <div className="app-container">
      {!currentUser || currentView === 'login' ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : currentView === 'success' ? (
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
                <div className="dashboard-title-box">
                  <div className="badge-pill-cyan">
                    <PlayCircle size={14} /> AspireNext Ultra HD Module
                  </div>
                  <h1 className="dashboard-main-heading">
                    Interactive Video Training Session
                  </h1>
                  <p className="dashboard-subheading">
                    Experience state-of-the-art tech education. Your session watch history is automatically recorded in real time.
                  </p>
                </div>

                <VideoPlayer
                  user={currentUser}
                  savedProgress={savedProgress}
                  onComplete={handleVideoCompleted}
                  onDurationChange={setVideoDuration}
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
                        <div className="stat-val">{Math.floor(savedProgress.currentTime || 0)} seconds</div>
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
