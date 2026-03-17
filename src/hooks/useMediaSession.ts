import { useEffect, useRef } from 'react';
import type { Video } from '../types';

interface UseMediaSessionProps {
  track: Video | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const useMediaSession = ({
  track,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: UseMediaSessionProps) => {
  const callbacksRef = useRef({ onPlay, onPause, onNext, onPrev });

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onPlay, onPause, onNext, onPrev };
  }, [onPlay, onPause, onNext, onPrev]);

  // Main Media Session setup
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;

    // Get or create hidden audio element for Media Session API
    let audioElement = document.getElementById('hidden-audio-player') as HTMLAudioElement;
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = 'hidden-audio-player';
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
    }

    // Sync audio element state with player
    if (isPlaying) {
      audioElement.play().catch(() => {
        console.log('Could not auto-play audio element');
      });
    } else {
      audioElement.pause();
    }

    // Set metadata for notification/lock screen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.channelName,
      artwork: [
        {
          src: track.thumbnailUrl,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: track.thumbnailUrl,
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Handle media control actions
    navigator.mediaSession.setActionHandler('play', () => {
      callbacksRef.current.onPlay();
      audioElement.play().catch(() => {});
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      callbacksRef.current.onPause();
      audioElement.pause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      callbacksRef.current.onNext();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      callbacksRef.current.onPrev();
    });

    // Update service worker with current media session state
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_MEDIA_SESSION',
        data: {
          trackId: track.id,
          title: track.title,
          channelName: track.channelName,
          thumbnailUrl: track.thumbnailUrl,
          isPlaying
        }
      });
    }

    // Persist to localStorage for recovery
    try {
      localStorage.setItem('geminiqtube-mediaSession', JSON.stringify({
        trackId: track.id,
        title: track.title,
        channelName: track.channelName,
        thumbnailUrl: track.thumbnailUrl,
        isPlaying
      }));
    } catch (e) {
      console.log('Failed to save media session state:', e);
    }

    return () => {
      // Cleanup handlers
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch (error) {
        console.log('Error cleaning up media session', error);
      }
    };
  }, [track, isPlaying]);

  // Listen for messages from service worker (when app is backgrounded)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: any) => {
      const { type, action } = event.data;

      if (type === 'MEDIA_ACTION') {
        console.log('Received media action from SW:', action);
        switch (action) {
          case 'play':
            callbacksRef.current.onPlay();
            break;
          case 'pause':
            callbacksRef.current.onPause();
            break;
          case 'next':
          case 'nexttrack':
            callbacksRef.current.onNext();
            break;
          case 'previous':
          case 'previoustrack':
            callbacksRef.current.onPrev();
            break;
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);
};
