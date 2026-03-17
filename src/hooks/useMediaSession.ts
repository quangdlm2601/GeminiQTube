import { useEffect } from 'react';
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
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;

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
      onPlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      onPause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      onNext();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      onPrev();
    });

    // Optional: Handle seek actions
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      // Not needed for music player, but can be added if needed
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      // Not needed for music player, but can be added if needed
    });

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
  }, [track, isPlaying, onPlay, onPause, onNext, onPrev]);
};
