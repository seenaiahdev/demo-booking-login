// Purpose: Clean WebGL portal login page strictly validating authentication against Supabase demo_booking table and displaying explicit account-not-found alert messages.

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Info } from 'lucide-react';
import ThreeBackground from './ThreeBackground';
import logoImg from '../assests/Logo_f8hqc0.jpg';

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please fill in both Email/Mobile and Password.');
      return;
    }

    if (!agreed) {
      setError('You must agree to the Terms & Conditions to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        // Display exact explicit error message from backend
        setError(data.message || 'Account does not exist. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setError('Account does not exist. Please verify your email or mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-3d-wrapper">
      <ThreeBackground />

      <div className="glass-login-card-3d">
        {/* Header containing logo icon */}
        <div className="card-brand-header" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div className="brand-logo-badge">
            <img src={logoImg} alt="Logo" className="logo-badge-img" style={{ height: '44px' }} />
          </div>
        </div>

        <div className="form-header">
          <h1 className="form-title" style={{ textAlign: 'center' }}>Portal Sign In</h1>
          <p className="form-subtitle" style={{ textAlign: 'center' }}>
            Enter your details to access your video training session.
          </p>
        </div>

        {error && (
          <div className="alert-error-aspire">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-aspire">
            <label className="form-label-aspire">
              Email or Mobile Number<span>*</span>
            </label>
            <div className="input-wrapper-aspire">
              <Mail className="input-icon-aspire" size={16} />
              <input
                type="text"
                className="input-aspire"
                placeholder="Enter your registered email or mobile"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-aspire">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label className="form-label-aspire" style={{ margin: 0 }}>
                Password <span>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Info size={12} /> Format: firstname@last4digits
              </span>
            </div>
            <div className="input-wrapper-aspire">
              <Lock className="input-icon-aspire" size={16} />
              <input
                type="password"
                className="input-aspire"
                placeholder="Enter password (e.g. rahul@5678)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="terms-row">
            <input
              type="checkbox"
              id="termsCheck"
              className="terms-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="termsCheck">
              I agree to the Terms & Conditions and understand my session data will be saved.
            </label>
          </div>

          <button type="submit" className="btn-aspire-primary" disabled={isLoading}>
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
