import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, CheckCircle, Sparkles } from 'lucide-react';
import { syncProgressWithBackend } from '../utils/storage';

// Default YouTube video ID as fallback
const FALLBACK_YT_VIDEO_ID = '8KCuHHeC_M0';

export default function VideoPlayer({ user, savedProgress, onComplete, onDurationChange }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const lastSavedSecondRef = useRef(-1);
  const progressIntervalRef = useRef(null);
  const apiReadyRef = useRef(false);
  const hasResumedRef = useRef(false);
  const savedProgressRef = useRef(savedProgress);

  const [globalVideoId, setGlobalVideoId] = useState('');
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

  // Keep savedProgressRef in sync
  useEffect(() => {
    savedProgressRef.current = savedProgress;
  }, [savedProgress]);

  // Fetch dynamic video configuration from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
        const res = await fetch(`${API_BASE}/video-config`);
        const data = await res.json();
        if (data.success) {
          if (data.videoId) setGlobalVideoId(data.videoId);
          if (data.controls) setGlobalControls(data.controls);
        } else {
          setGlobalVideoId(FALLBACK_YT_VIDEO_ID);
        }
      } catch (err) {
        setGlobalVideoId(FALLBACK_YT_VIDEO_ID);
      }
    };
    fetchConfig();
  }, []);

  // When savedProgress arrives from Supabase, restore state and seek YouTube player
  useEffect(() => {
    if (savedProgress && savedProgress.currentTime > 0) {
      setCurrentTime(savedProgress.currentTime);
      setMaxWatchedTime(savedProgress.currentTime);
      setIsCompleted(!!savedProgress.completed);

      // If player is already ready, seek to saved position
      if (playerRef.current && playerRef.current.seekTo && !hasResumedRef.current) {
        hasResumedRef.current = true;
        playerRef.current.seekTo(savedProgress.currentTime, true);
      }
    }
    if (savedProgress) {
      setIsCompleted(!!savedProgress.completed);
    }
  }, [savedProgress]);

  // Load YouTube IFrame API script once we have a video ID
  useEffect(() => {
    if (!globalVideoId) return; // Wait until config is fetched

    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      initPlayer();
    };

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
      }
    };
  }, [globalVideoId]);

  const initPlayer = useCallback(() => {
    if (!apiReadyRef.current || !ytContainerRef.current) return;
    if (playerRef.current) return;

    // Read the latest savedProgress from ref (may have been fetched by now)
    const resumeTime = savedProgressRef.current?.currentTime || 0;

    playerRef.current = new window.YT.Player(ytContainerRef.current, {
      videoId: globalVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        start: Math.floor(resumeTime),
        playsinline: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          const player = event.target;
          const ytDuration = player.getDuration();
          if (ytDuration > 0) {
            setDuration(ytDuration);
            if (onDurationChange) onDurationChange(ytDuration);
          }

          // Resume from saved position (use latest ref value)
          const latestResumeTime = savedProgressRef.current?.currentTime || 0;
          if (latestResumeTime > 0) {
            player.seekTo(latestResumeTime, true);
            setCurrentTime(latestResumeTime);
            setMaxWatchedTime(latestResumeTime);
            hasResumedRef.current = true;
          }

          setPlayerReady(true);
        },
        onStateChange: (event) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startProgressTracking();
          } else if (state === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            stopProgressTracking();
            if (user?.id && playerRef.current) {
              const time = playerRef.current.getCurrentTime();
              syncProgressWithBackend(user, time, isCompleted);
            }
          } else if (state === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            setIsCompleted(true);
            stopProgressTracking();
            if (user?.id) {
              syncProgressWithBackend(user, duration, true);
            }
            if (onComplete) onComplete();
          }
        }
      }
    });
  }, [user, onDurationChange, onComplete, duration, isCompleted, globalVideoId]);

  // Re-init player when YT container is available
  useEffect(() => {
    if (apiReadyRef.current && ytContainerRef.current && !playerRef.current) {
      initPlayer();
    }
  }, [initPlayer]);

  // Handle seeking manually via progress bar (restricted by max watched)
  const handleSeek = (e) => {
    if (!playerRef.current || !apiReadyRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    // Anti-cheat: prevent skipping to un-watched segments unless allowed
    if (!globalControlsRef.current?.allowSkip && newTime > maxWatchedTime) return;

    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  // Progress tracking interval
  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (!playerRef.current || !playerRef.current.getCurrentTime) return;

      const actualTime = playerRef.current.getCurrentTime();
      const currentSecond = Math.floor(actualTime);

      setCurrentTime(actualTime);

      // Anti-cheat: prevent skipping ahead unless allowSkip is enabled
      setMaxWatchedTime(prev => {
        if (!globalControlsRef.current.allowSkip && actualTime > prev + 3) {
          playerRef.current.seekTo(prev, true);
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
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Cleanup on unmount — save final progress
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (user?.id && playerRef.current && playerRef.current.getCurrentTime) {
        try {
          syncProgressWithBackend(user, playerRef.current.getCurrentTime(), isCompleted);
        } catch (e) { /* ignore */ }
      }
    };
  }, [user, isCompleted]);

  // Player Control Actions
  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || !playerReady) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current && playerReady) {
      playerRef.current.setVolume(newVol);
      if (newVol === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

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
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
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
        <div className="yt-video-wrapper" onClick={togglePlay}>
          <div
            ref={ytContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />

          {!isPlaying && playerReady && (
            <div className="yt-big-play-overlay">
              <div className="yt-play-icon-circle-glow">
                <Play size={40} fill="white" style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}

          {!playerReady && (
            <div className="yt-big-play-overlay" style={{ cursor: 'default' }}>
              <div style={{
                color: '#38bdf8',
                fontSize: '1rem',
                fontWeight: 700,
                textAlign: 'center',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
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
                <Sparkles size={12} /> YouTube HD
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
