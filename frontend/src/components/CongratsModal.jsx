// Purpose: Interactive celebratory modal dialog featuring dynamic particle blast fireworks to reward users upon 100% completion of the mandatory video module.

import React, { useEffect, useRef } from 'react';
import { Trophy, CheckCircle, RotateCcw, X } from 'lucide-react';

export default function CongratsModal({ onClose, onReplay }) {
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

    // Particle Blast Setup
    const particles = [];
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fbbf24', '#34d399'];

    const createExplosion = (x, y) => {
      const particleCount = 80;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.01,
          gravity: 0.15
        });
      }
    };

    // Trigger initial central burst + interval bursts
    createExplosion(width / 2, height / 2 - 50);
    const intervalId = setInterval(() => {
      createExplosion(
        Math.random() * (width * 0.6) + width * 0.2,
        Math.random() * (height * 0.5) + height * 0.1
      );
    }, 600);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="modal-overlay">
      <canvas ref={canvasRef} className="blast-canvas" />

      <div className="glass-card congrats-card">
        <button className="btn-logout" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }} onClick={onClose}>
          <X size={18} />
        </button>

        <div className="trophy-icon-wrapper">
          <Trophy size={42} />
        </div>

        <div className="completed-badge">
          <CheckCircle size={16} /> Module Fully Completed
        </div>

        <h2 className="congrats-title">Congratulations!</h2>
        <p className="congrats-subtitle">
          You have successfully watched the entire video from start to finish without skipping! Your progress has been officially saved.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onClose}>
            Awesome! Continue
          </button>
          <button
            className="ctrl-btn ctrl-btn-continue"
            style={{ padding: '0.9rem 1.25rem', borderRadius: '12px' }}
            onClick={onReplay}
          >
            <RotateCcw size={18} /> Re-watch Video
          </button>
        </div>
      </div>
    </div>
  );
}
