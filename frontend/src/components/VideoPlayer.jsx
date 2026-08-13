import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player/lazy';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, CheckCircle, Sparkles } from 'lucide-react';
import { syncProgressWithBackend } from '../utils/storage';

const FALLBACK_YT_VIDEO_ID = 'https://www.youtube.com/watch?v=8KCuHHeC_M0';

export default function VideoPlayer({ user, savedProgress, onComplete, onDurationChange, onProgressUpdate }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const lastSavedSecondRef = useRef(-1);
  const hasResumedRef = useRef(false);

  const [globalVideoUrl, setGlobalVideoUrl] = useState('');
  const [globalControls, setGlobalControls] = useState({
    playPause: true,
    volume: true,
    fullscreen: true,
    allowSkip: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(2700);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  // Fetch dynamic video configuration from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
        const res = await fetch(`${API_BASE}/video-config`);
        const data = await res.json();
        if (data.success) {
          if (data.videoId) {
            // Handle backwards compatibility for raw 11-char IDs
            let val = data.videoId;
            if (val.length === 11 && !val.includes('/') && !val.includes('.')) {
              val = `https://www.youtube.com/watch?v=${val}`;
            }
            setGlobalVideoUrl(val);
          }
          if (data.controls) setGlobalControls(data.controls);
        } else {
          setGlobalVideoUrl(FALLBACK_YT_VIDEO_ID);
        }
      } catch (err) {
        setGlobalVideoUrl(FALLBACK_YT_VIDEO_ID);
      }
    };
    fetchConfig();
  }, []);

  // When savedProgress arrives from Supabase, restore state
  useEffect(() => {
    if (savedProgress && savedProgress.currentTime > 0) {
      setCurrentTime(savedProgress.currentTime);
      setMaxWatchedTime(savedProgress.currentTime);
      setIsCompleted(!!savedProgress.completed);
    }
  }, [savedProgress]);

  const handleProgress = (state) => {
    if (!playerReady) return;
    
    const actualTime = state.playedSeconds;
    const currentSecond = Math.floor(actualTime);

    setCurrentTime(actualTime);
    if (onProgressUpdate) onProgressUpdate(actualTime);

    // Anti-cheat: prevent skipping ahead
    setMaxWatchedTime(prev => {
      if (!globalControls.allowSkip && actualTime > prev + 3) {
        if (playerRef.current) {
          playerRef.current.seekTo(prev, 'seconds');
        }
        setCurrentTime(prev);
        return prev;
      }
      return Math.max(prev, actualTime);
    });

    // Save progress to Supabase on every new integer second
    if (user?.id && currentSecond !== lastSavedSecondRef.current) {
      lastSavedSecondRef.current = currentSecond;
      syncProgressWithBackend(user, actualTime, false);
    }
  };

  const handleDuration = (dur) => {
    setDuration(dur);
    if (onDurationChange) onDurationChange(dur);
  };

  const handleReady = () => {
    setPlayerReady(true);
    if (!hasResumedRef.current && savedProgress?.currentTime > 0) {
      playerRef.current.seekTo(savedProgress.currentTime, 'seconds');
      hasResumedRef.current = true;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsCompleted(true);
    if (onComplete) onComplete();
    if (user?.id && playerRef.current) {
      syncProgressWithBackend(user, playerRef.current.getCurrentTime(), true);
    }
  };

  // Handle seeking manually via progress bar (restricted by max watched)
  const handleSeek = (e) => {
    if (!playerRef.current || !playerReady) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    if (!globalControls.allowSkip && newTime > maxWatchedTime) return;

    playerRef.current.seekTo(newTime, 'seconds');
    setCurrentTime(newTime);
  };

  // Cleanup on unmount — save final progress
  useEffect(() => {
    return () => {
      if (user?.id && playerRef.current) {
        try {
          syncProgressWithBackend(user, playerRef.current.getCurrentTime(), isCompleted);
        } catch (e) { /* ignore */ }
      }
    };
  }, [user, isCompleted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="premium-theater-wrapper">
      <div className="ambient-theater-glow" />

      <div
        className="yt-player-container premium-card-frame"
        ref={containerRef}
        onMouseEnter={() => setShowControlsOverlay(true)}
        onMouseLeave={() => isPlaying && setShowControlsOverlay(false)}
      >
        <div className="yt-video-wrapper" onClick={togglePlay} style={{ position: 'relative', width: '100%', height: '100%' }}>
          {globalVideoUrl && (
            <ReactPlayer
              ref={playerRef}
              url={globalVideoUrl}
              playing={isPlaying}
              volume={isMuted ? 0 : volume / 100}
              muted={isMuted}
              onReady={handleReady}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              progressInterval={500}
              config={{
                youtube: {
                  playerVars: { controls: 0, modestbranding: 1, rel: 0, disablekb: 1 }
                }
              }}
            />
          )}

          {!isPlaying && playerReady && (
            <div className="yt-big-play-overlay">
              <div className="yt-play-icon-circle-glow">
                <Play size={40} fill="white" style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}

          {!playerReady && (
            <div className="yt-big-play-overlay" style={{ cursor: 'default' }}>
              <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 700, textAlign: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
                Loading Course Video...
              </div>
            </div>
          )}
        </div>

        <div className={`yt-controls-bar ${showControlsOverlay ? 'visible' : ''}`}>
          <div
            className={globalControls.allowSkip ? "yt-progress-container-aspire" : "yt-progress-container-locked"}
            style={{ pointerEvents: globalControls.allowSkip ? 'auto' : 'none', cursor: globalControls.allowSkip ? 'pointer' : 'not-allowed', height: '10px', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', position: 'relative' }}
            onClick={globalControls.allowSkip ? handleSeek : undefined}
          >
            <div className="yt-progress-track" style={{ height: '100%', width: '100%' }}>
              <div className="yt-progress-fill-cyan" style={{ width: `${currentPct}%`, height: '100%', backgroundColor: '#06b6d4' }} />
            </div>
          </div>

          <div className="yt-controls-main">
            <div className="yt-controls-left">
              {globalControls.playPause && (
                <button className="yt-icon-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                </button>
              )}

              {globalControls.volume && (
                <div className="yt-volume-group">
                  <button className="yt-icon-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="yt-volume-slider"
                  />
                </div>
              )}

              <div className="yt-time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="yt-controls-right">
              {isCompleted && (
                <span className="yt-badge-completed">
                  <CheckCircle size={14} /> Completed
                </span>
              )}
              <span className="yt-hd-badge">
                <Sparkles size={12} /> HD
              </span>
              {globalControls.fullscreen && (
                <button className="yt-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
