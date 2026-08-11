// Purpose: Clean navigation bar featuring brand logo icon, personalized user profile avatar, and secure logout action.

import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import logoImg from '../assests/Logo_f8hqc0.jpg';

export default function Header({ user, onLogout }) {
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="header-bar-aspire">
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={logoImg} alt="Aspire Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>AspireNext</span>
      </div>

      <div className="header-user-section">
        <div className="welcome-badge-aspire">
          <div className="user-avatar-aspire">{userInitial}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              Welcome, {user?.name || 'Learner'}!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
              <ShieldCheck size={14} /> Logged In
            </div>
          </div>
        </div>

        <button onClick={onLogout} className="btn-logout-aspire" title="Log out of session">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
