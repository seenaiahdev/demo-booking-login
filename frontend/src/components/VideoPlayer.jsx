import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, CheckCircle, Sparkles } from 'lucide-react';
import { syncProgressWithBackend } from '../utils/storage';

export default function VideoPlayer({ user, savedProgress, onComplete, onDurationChange }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const lastSavedSecondRef = useRef(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  const [activeVideoSrc, setActiveVideoSrc] = useState('https://media.w3.org/2010/05/sintel/trailer_hd.mp4');

  const fallbackSources = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ];
  const [fallbackIndex, setFallbackIndex] = useState(-1);



  const currentVideoSource = fallbackIndex >= 0 ? fallbackSources[fallbackIndex] : activeVideoSrc;

  // Restore saved progress on mount
  useEffect(() => {
    if (savedProgress) {
      const initialTime = savedProgress.currentTime || 0;
      setCurrentTime(initialTime);
      setMaxWatchedTime(initialTime);
      setIsCompleted(!!savedProgress.completed);
    }
  }, [savedProgress]);

  // Set start position when video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      if (onDurationChange) onDurationChange(videoDuration);

      const startTime = savedProgress?.currentTime || 0;
      if (startTime > 0 && startTime < videoDuration) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        setMaxWatchedTime(startTime);
      }
    }
  };

  // Real-time time update & strict second-by-second Supabase progress sync
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const actualTime = videoRef.current.currentTime;
    const currentSecond = Math.floor(actualTime);

    if (!isCompleted && actualTime > maxWatchedTime + 1.5) {
      videoRef.current.currentTime = maxWatchedTime;
      setCurrentTime(maxWatchedTime);
      return;
    }

    if (actualTime > maxWatchedTime) {
      setMaxWatchedTime(actualTime);
    }

    setCurrentTime(actualTime);

    // Save progress to Supabase backend on every new integer second (1s, 2s, 3s... 9s)
    if (user?.id && currentSecond !== lastSavedSecondRef.current) {
      lastSavedSecondRef.current = currentSecond;
      syncProgressWithBackend(user.id, actualTime, isCompleted);
    }
  };

  // Automatic Failover if a video URL fails to load
  const handleVideoError = () => {
    console.warn(`Video source ${currentVideoSource} notice. Failing over...`);
    if (fallbackIndex < fallbackSources.length - 1) {
      setFallbackIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
      setIsPlaying(false);
      setDuration(0);
    }
  }, [currentVideoSource]);

  // Completion Handler -> Triggers Success View Navigation & 100% Supabase save
  const handleEnded = () => {
    setIsPlaying(false);
    setIsCompleted(true);
    if (user?.id) {
      syncProgressWithBackend(user.id, duration, true);
    }
    if (onComplete) {
      onComplete();
    }
  };

  // Player Control Actions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (user?.id) syncProgressWithBackend(user.id, videoRef.current.currentTime, isCompleted);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
        handleVideoError();
      });
    }
  };

  // Volume Controls
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.warn(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.warn(err));
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="premium-theater-wrapper">
      {/* Ambient Theater Backglow Effect */}
      <div className="ambient-theater-glow" />

      <div
        className="yt-player-container premium-card-frame"
        ref={containerRef}
        onMouseEnter={() => setShowControlsOverlay(true)}
        onMouseLeave={() => isPlaying && setShowControlsOverlay(false)}
      >
        <div className="yt-video-wrapper" onClick={togglePlay}>
          <video
            ref={videoRef}
            className="yt-video-element"
            src={currentVideoSource}
            controls={false}
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleVideoError}
            playsInline
          />

          {/* Big Central Play Overlay Button when Paused */}
          {!isPlaying && (
            <div className="yt-big-play-overlay">
              <div className="yt-play-icon-circle-glow">
                <Play size={40} fill="white" style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Integrated Bottom Controls Bar */}
        <div className={`yt-controls-bar ${showControlsOverlay ? 'visible' : ''}`}>
          {/* COMPLETELY LOCKED PROGRESS BAR (NON-CLICKABLE / NO POINTER EVENTS) */}
          <div
            className="yt-progress-container-locked"
            style={{ pointerEvents: 'none', cursor: 'not-allowed' }}
          >
            <div className="yt-progress-track">
              <div className="yt-progress-fill-cyan" style={{ width: `${currentPct}%` }} />
            </div>
          </div>

          <div className="yt-controls-main">
            <div className="yt-controls-left">
              {/* Play / Pause Toggle Button */}
              <button className="yt-icon-btn" onClick={togglePlay} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
                {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
              </button>

              {/* Volume Control Group */}
              <div className="yt-volume-group">
                <button className="yt-icon-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="yt-volume-slider"
                />
              </div>

              {/* Timings Display */}
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
                <Sparkles size={12} /> 1080p Ultra HD
              </span>
              <button className="yt-icon-btn" onClick={toggleFullscreen} title="Fullscreen (f)">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
