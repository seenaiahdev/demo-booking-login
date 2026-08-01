// Purpose: Dedicated celebratory completion view featuring a modern top-down confetti drop transition animation, verified status badge, and secure session logout action.

import React, { useEffect, useRef } from 'react';
import { Trophy, ShieldCheck, LogOut } from 'lucide-react';

export default function SuccessPage({ user, onLogout }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Modern Top-Down Confetti Drop Setup
    const confettiCount = 90;
    const confettiSlips = [];
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fbbf24', '#34d399', '#ff71ce'];

    // Spawn slips across top of screen to drop smoothly
    for (let i = 0; i < confettiCount; i++) {
      confettiSlips.push({
        x: Math.random() * (width * 0.8) + width * 0.1,
        y: Math.random() * -300 - 20, // Start above viewport
        w: Math.random() * 7 + 6,
        h: Math.random() * 12 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 2 + 1.8,
        vx: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 3 - 1.5,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        alpha: 1,
      });
    }

    // Render gentle top-down confetti drop animation
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let activeCount = 0;

      for (let i = 0; i < confettiSlips.length; i++) {
        const p = confettiSlips[i];
        p.y += p.vy;
        p.x += Math.sin(p.wobble) * 1.2 + p.vx;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        // Fade out near bottom of screen
        if (p.y > height * 0.75) {
          p.alpha -= 0.015;
        }

        if (p.alpha > 0 && p.y < height + 40) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (activeCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="success-page-container">
      <canvas ref={canvasRef} className="blast-canvas" />

      <div className="success-content-wrapper">
        <div className="success-card-glass">
          <div className="trophy-badge-glow">
            <Trophy size={44} color="#ffffff" />
          </div>

          <div className="verified-pill">
            <ShieldCheck size={16} /> Verified Training Completed
          </div>

          <h1 className="success-title">Congratulations, {user?.name || 'Learner'}!</h1>
          <p className="success-subtitle">
            You have successfully completed 100% of your video training session. Your session completion is recorded in the AspireNext system.
          </p>

          {/* Primary Action: Logout Button Only */}
          <div className="success-actions-row">
            <button className="btn-success-logout" onClick={onLogout}>
              <LogOut size={18} />
              Logout & Exit Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
