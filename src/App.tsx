

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { VideoList } from './components/VideoList';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoDetail } from './components/VideoDetail';
import { CommentSection } from './components/CommentSection';
import { searchVideos, getVideoDetails, getComments, getPopularVideos } from '../services/geminiService';
import type { Video, Comment } from './types';
import { AutoplayToggle } from './components/AutoplayToggle';
import { ChevronDownIcon } from './components/icons/ChevronDownIcon';
import { MusicPlayer } from './components/MusicPlayer';
import { MiniPlayer } from './components/MiniPlayer';
import { SearchOverlay } from './components/SearchOverlay';
import { Capacitor } from '@capacitor/core';
import { nativeAudioService } from './nativeAudioService';
import { NativeMusicPlayer } from './components/SPMusicPlayer';


const parseDurationToSeconds = (duration: string): number => {
    if (!duration || typeof duration !== 'string') return 0;

    // Handle ISO 8061 format (e.g., "PT1M35S")
    if (duration.startsWith('PT')) {
        let totalSeconds = 0;
        // new RegExp(...) is used to avoid escaping issues in some environments.
        const matches = duration.match(new RegExp('(\\d+H)?(\\d+M)?(\\d+S)?'));
        if (!matches) return 0;
        
        const hours = (matches[1] || '').match(/\d+/);
        if (hours) totalSeconds += parseInt(hours[0], 10) * 3600;

        const minutes = (matches[2] || '').match(/\d+/);
        if (minutes) totalSeconds += parseInt(minutes[0], 10) * 60;
        
        const seconds = (matches[3] || '').match(/\d+/);
        if (seconds) totalSeconds += parseInt(seconds[0], 10);
        
        return totalSeconds;
    }

    // Handle "HH:MM:SS" or "MM:SS" format
    const parts = duration.split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) { // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) { // MM:SS
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) { // SS
        return parts[0];
    }

    return 0;
};


const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]); // For search results
  const [homeRelatedVideos, setHomeRelatedVideos] = useState<Video[]>([]);
  const [homePopularVideos, setHomePopularVideos] = useState<Video[]>([]);

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsNextPageToken, setCommentsNextPageToken] = useState<string | null | undefined>(null);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState<boolean>(false);

  const [queue, setQueue] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoplayOn, setIsAutoplayOn] = useState<boolean>(true);

  const [nextPageToken, setNextPageToken] = useState<string | undefined | null>(null); // For search results
  const [homePopularNextPageToken, setHomePopularNextPageToken] = useState<string | undefined | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [currentRelatedQuery, setCurrentRelatedQuery] = useState<string>('');
  
  const [isCommentsVisible, setIsCommentsVisible] = useState<boolean>(window.innerWidth >= 768);
  const [relatedVideosNextPageToken, setRelatedVideosNextPageToken] = useState<string | undefined | null>(null);
  const [isLoadingMoreRelated, setIsLoadingMoreRelated] = useState<boolean>(false);
  
  const [lastWatchedVideo, setLastWatchedVideo] = useState<Video | null>(() => {
    try {
        const saved = localStorage.getItem('lastWatchedVideo');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Failed to parse last watched video from localStorage", e);
        return null;
    }
  });

  // Web Music Player State
  const [musicPlaylist, setMusicPlaylist] = useState<Video[]>([]);
  const [currentMusicTrackIndex, setCurrentMusicTrackIndex] = useState<number>(-1);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  // Native Music Player State
  const isNative = Capacitor.isNativePlatform();
  const [nativePlaylist, setNativePlaylist] = useState<Video[]>([]);
  const [nativePlayerState, setNativePlayerState] = useState<{ isPlaying: boolean; currentTrackId: string | null }>({ isPlaying: false, currentTrackId: null });

  // Mini Player State
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState<boolean>(false);
  const [videoPlaybackState, setVideoPlaybackState] = useState<{currentTime: number, isPlaying: boolean}>({
    currentTime: 0,
    isPlaying: false,
  });

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>('');

  // Viewport State for responsive behavior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileCommentsPage, setMobileCommentsPage] = useState(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('geminiqtube-searchHistory');
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
        const lastQuery = localStorage.getItem('geminiqtube-lastSearch');
        if (lastQuery) {
            setSearchInputValue(lastQuery);
        }
    } catch (e) {
        console.error("Failed to parse search history from localStorage", e);
        setSearchHistory([]);
    }
  }, []);
  
  // Effect to set up listeners for the native audio service
  useEffect(() => {
    if (isNative) {
        const onPlaybackStateChange = (info: { isPlaying: boolean }) => {
            setNativePlayerState(prev => ({ ...prev, isPlaying: info.isPlaying }));
        };
        const onTrackChange = (info: { track?: { trackId: string }}) => {
             if(info.track) {
                setNativePlayerState(prev => ({ ...prev, currentTrackId: info.track.trackId }));
             }
        };
        
        nativeAudioService.addEventListener('playbackStateChanged', onPlaybackStateChange);
        nativeAudioService.addEventListener('trackChanged', onTrackChange);

        return () => {
            nativeAudioService.removeEventListener('playbackStateChanged', onPlaybackStateChange);
            nativeAudioService.removeEventListener('trackChanged', onTrackChange);
        }
    }
  }, [isNative]);

  const updateSearchHistory = (query: string) => {
      const newHistory = [
          query,
          ...searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase())
      ].slice(0, 8);
      setSearchHistory(newHistory);
      try {
        localStorage.setItem('geminiqtube-searchHistory', JSON.stringify(newHistory));
        localStorage.setItem('geminiqtube-lastSearch', query);
      } catch (e) {
        console.error("Failed to save search history to localStorage", e);
      }
  };

  const clearSearchHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('geminiqtube-searchHistory');
  };

  const handleRemoveFromSearchHistory = useCallback((queryToRemove: string) => {
      const newHistory = searchHistory.filter(item => item !== queryToRemove);
      setSearchHistory(newHistory);
      try {
          localStorage.setItem('geminiqtube-searchHistory', JSON.stringify(newHistory));
      } catch (e) {
          console.error("Failed to update search history in localStorage", e);
      }
  }, [searchHistory]);

  const fetchAndSetHomePage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(null);
    setVideos([]);
    setHomeRelatedVideos([]);
    setHomePopularVideos([]);

    try {
      const popularPromise = getPopularVideos();
      const relatedPromise = lastWatchedVideo
        ? searchVideos(`Related to ${lastWatchedVideo.title}`, undefined, '8')
        : Promise.resolve(null);
      
      const [popularResult, relatedResult] = await Promise.allSettled([popularPromise, relatedPromise]);

      if (popularResult.status === 'fulfilled') {
        const uniqueVideos = popularResult.value.videos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setHomePopularVideos(uniqueVideos);
        setHomePopularNextPageToken(popularResult.value.nextPageToken || null);
      } else {
        console.error("Failed to fetch popular videos:", popularResult.reason);
        setError('Failed to fetch trending videos.');
      }

      if (relatedResult.status === 'fulfilled' && relatedResult.value) {
        const uniqueVideos = relatedResult.value.videos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setHomeRelatedVideos(uniqueVideos);
      } else if (relatedResult.status === 'rejected') {
        console.error("Failed to fetch related videos:", relatedResult.reason);
        // Don't set a general error, just let the section be empty
      }

    } catch (err) {
        setError('Failed to fetch videos. Please try again.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [lastWatchedVideo]);

  const fetchAndSetSearchResults = useCallback(async (query: string) => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setHomeRelatedVideos([]);
    setHomePopularVideos([]);
    setCurrentQuery(query);
    setSearchInputValue(query);
    try {
      const { videos: results, nextPageToken: newNextPageToken } = await searchVideos(query);
      const uniqueVideos = results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setVideos(uniqueVideos);
      setNextPageToken(newNextPageToken || null);
    } catch (err) {
      setError('Failed to fetch videos. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchAndSetVideoDetails = useCallback(async (video: Video, options: { keepMiniPlayer?: boolean } = {}) => {
    const isPartial = !video.title; 

    if (!options.keepMiniPlayer) {
      setIsMiniPlayerActive(false);
      
      if (!isNative) { // Don't disrupt native music for video playback
        setIsMusicPlaying(false);
      }
      
      setVideoPlaybackState({ currentTime: 0, isPlaying: true });
      window.scrollTo(0, 0);
    }

    if (isPartial) {
        setSelectedVideo(null);
        if (!options.keepMiniPlayer) setIsLoading(true);
    } else {
        setSelectedVideo(video);
    }
    
    setIsDetailsLoading(true);
    if (!options.keepMiniPlayer) {
      setComments([]);
      setCommentsNextPageToken(null);
      setIsCommentsVisible(window.innerWidth >= 768);
      setMobileCommentsPage(1);
    }

    try {
        const detailsPromise = getVideoDetails(video.id);
        const commentsPromise = getComments(video.id);

        const [detailsResult, commentsResult] = await Promise.allSettled([detailsPromise, commentsPromise]);
        
        let videoDetails: Partial<Video>;
        if (detailsResult.status === 'fulfilled') {
            videoDetails = detailsResult.value;
        } else {
            throw new Error("Failed to fetch video details");
        }
        
        if (commentsResult.status === 'fulfilled') {
            setComments(commentsResult.value.comments);
            setCommentsNextPageToken(commentsResult.value.nextPageToken);
        } else {
            console.error("Failed to fetch comments:", commentsResult.reason);
        }

        const fullVideo: Video = {
            ...video,
            ...videoDetails,
            id: video.id,
            title: videoDetails.title || video.title || 'Untitled',
            channelName: videoDetails.channelName || video.channelName || 'Unknown Channel'
        };

        setSelectedVideo(fullVideo);
        setLastWatchedVideo(fullVideo);
        try {
            localStorage.setItem('lastWatchedVideo', JSON.stringify(fullVideo));
        } catch (e) {
            console.error("Failed to save last watched video to localStorage", e);
        }
        
        const initialRelatedQuery = `More videos about ${fullVideo.title}`;
        setCurrentRelatedQuery(initialRelatedQuery);
        const { videos: newRelated, nextPageToken: newNextPageToken } = await searchVideos(initialRelatedQuery);
        
        const filteredRelated = newRelated.filter(v => v.id !== video.id);

        if (filteredRelated.length > 0) {
            setRelatedVideos(filteredRelated);
            setRelatedVideosNextPageToken(newNextPageToken || null);
        } else {
            console.log("No specific related videos found. Falling back to homepage videos.");
            
            // Prioritize "Recommended for you", then "Trending", then fetch fresh popular videos.
            let fallbackVideos = homeRelatedVideos.length > 0 ? homeRelatedVideos : homePopularVideos;
            
            if (fallbackVideos.length === 0) {
                console.log("Homepage videos not loaded, fetching popular videos as a fallback.");
                try {
                    const popularResult = await getPopularVideos();
                    fallbackVideos = popularResult.videos;
                } catch (e) {
                    console.error("Failed to fetch fallback popular videos:", e);
                    fallbackVideos = []; // Ensure it's an array on failure
                }
            }
            
            setRelatedVideos(fallbackVideos.filter(v => v.id !== video.id));
            setRelatedVideosNextPageToken(null); // Fallback list is not paginated in this context
        }
    } catch (err) {
        setError('Failed to fetch video details. Please try again.');
        console.error(err);
        setSelectedVideo(null);
    } finally {
        setIsDetailsLoading(false);
        if (isPartial && !options.keepMiniPlayer) {
            setIsLoading(false);
        }
    }
  }, [homeRelatedVideos, homePopularVideos, isNative]);

  const handleLoadMoreComments = useCallback(async () => {
    if (!selectedVideo || isLoadingMoreComments || !commentsNextPageToken) return;

    setIsLoadingMoreComments(true);
    try {
        const { comments: newComments, nextPageToken: newNextPageToken } = await getComments(selectedVideo.id, commentsNextPageToken);
        setComments(prev => [...prev, ...newComments]);
        setCommentsNextPageToken(newNextPageToken);
    } catch (err) {
        console.error('Failed to load more comments:', err);
    } finally {
        setIsLoadingMoreComments(false);
    }
  }, [selectedVideo, isLoadingMoreComments, commentsNextPageToken]);

  const handleLoadMoreCommentsMobile = useCallback(() => {
    const commentsToShowCount = mobileCommentsPage * 5;
    // If we have enough comments loaded to show the next page, just increment the page number.
    if (commentsToShowCount < comments.length) {
        setMobileCommentsPage(prev => prev + 1);
    } 
    // If we are at the end of the loaded comments and there's a token for more, fetch them.
    else if (commentsNextPageToken && !isLoadingMoreComments) {
        handleLoadMoreComments().then(() => {
            // After fetching, also increment the page to show the new comments.
            setMobileCommentsPage(prev => prev + 1);
        });
    }
  }, [mobileCommentsPage, comments.length, commentsNextPageToken, isLoadingMoreComments, handleLoadMoreComments]);

  // History-aware navigation handlers
  const performSearch = useCallback((query: string) => {
    if (selectedVideo && !(isNative && nativePlayerState.isPlaying)) {
      setVideoPlaybackState(prev => ({...prev, isPlaying: true}));
      setIsMiniPlayerActive(true);
    } else {
      setSelectedVideo(null);
    }
    history.pushState({ type: 'list', query }, '', `/?search_query=${encodeURIComponent(query)}`);
    fetchAndSetSearchResults(query);
  }, [fetchAndSetSearchResults, selectedVideo, isNative, nativePlayerState.isPlaying]);
  
  // For mobile overlay
  const handleSearch = (query: string) => {
      if (!query.trim()) return;
      const trimmedQuery = query.trim();
      updateSearchHistory(trimmedQuery);
      performSearch(trimmedQuery);
      setIsSearchOpen(false);
  };

  const handleApplyHistoryItem = (query: string) => {
    setSearchInputValue(query);
  };

  // For desktop header bar
  const handleHeaderSearch = (query: string) => {
      if (!query.trim()) return;
      const trimmedQuery = query.trim();
      updateSearchHistory(trimmedQuery);
      performSearch(trimmedQuery);
  };

  const handleSelectVideo = useCallback((video: Video) => {
    history.pushState({ type: 'video', videoId: video.id }, '', `/?watch=${video.id}`);
    fetchAndSetVideoDetails(video);
  }, [fetchAndSetVideoDetails]);

  const handleLogoClick = useCallback(() => {
    if (selectedVideo && !(isNative && nativePlayerState.isPlaying)) {
        setVideoPlaybackState(prev => ({...prev, isPlaying: true}));
        setIsMiniPlayerActive(true);
    } else {
        setSelectedVideo(null);
    }
    history.pushState({ type: 'list', query: null }, '', `/`);
    fetchAndSetHomePage();
  }, [fetchAndSetHomePage, selectedVideo, isNative, nativePlayerState.isPlaying]);

  // Effect for handling initial load and browser history (back/forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { type, query, videoId } = event.state;
        if (type === 'list') {
            if (selectedVideo && !isMiniPlayerActive) {
                setVideoPlaybackState(prev => ({...prev, isPlaying: true}));
                setIsMiniPlayerActive(true);
            }
            setSelectedVideo(null);
            query ? fetchAndSetSearchResults(query) : fetchAndSetHomePage();
        } else if (type === 'video' && videoId) {
            if (selectedVideo?.id !== videoId) {
                fetchAndSetVideoDetails({ id: videoId } as Video);
            } else {
                setIsMiniPlayerActive(false);
            }
        }
      } else {
        // Fallback for states that might not have been pushed by our app
        const params = new URLSearchParams(window.location.search);
        const videoId = params.get('watch');
        const query = params.get('search_query');
        if (!videoId && !query) {
          fetchAndSetHomePage();
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);

    // Initial load logic based on URL
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('watch');
    const query = params.get('search_query');

    if (videoId) {
      history.replaceState({ type: 'video', videoId }, '', window.location.href);
      fetchAndSetVideoDetails({ id: videoId } as Video);
    } else if (query) {
      history.replaceState({ type: 'list', query }, '', window.location.href);
      fetchAndSetSearchResults(query);
    } else {
      history.replaceState({ type: 'list', query: null }, '', `/`);
      fetchAndSetHomePage();
    }
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore) return;
  
    // Determine which list to load more for
    const isHomePage = !currentQuery;
    const token = isHomePage ? homePopularNextPageToken : nextPageToken;
  
    if (!token) return;
  
    setIsLoadingMore(true);
    try {
      let newVideos: Video[] = [];
      let newNextPageToken: string | undefined | null = null;
      if (isHomePage) {
        const result = await getPopularVideos(token);
        newVideos = result.videos;
        newNextPageToken = result.nextPageToken;
        setHomePopularVideos(prev => [...prev, ...newVideos.filter(nv => !prev.some(pv => pv.id === nv.id))]);
        setHomePopularNextPageToken(newNextPageToken || null);
      } else {
        const result = await searchVideos(currentQuery!, token);
        newVideos = result.videos;
        newNextPageToken = result.nextPageToken;
        setVideos(prev => [...prev, ...newVideos.filter(nv => !prev.some(pv => pv.id === nv.id))]);
        setNextPageToken(newNextPageToken || null);
      }
    } catch (err) {
      console.error('Failed to load more videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, currentQuery, nextPageToken, homePopularNextPageToken]);

  const handleLoadMoreRelated = useCallback(async () => {
    // Guard conditions: don't run if already loading, or if there's no way to get more videos.
    if (!selectedVideo || isLoadingMoreRelated) return;

    // We can fetch more if we have a pagination token, OR if we can create a "chained" query.
    const canFetchFromToken = !!relatedVideosNextPageToken;
    const canChainRelevance = !relatedVideosNextPageToken && relatedVideos.length > 0;

    if (!canFetchFromToken && !canChainRelevance) {
      return; // Nothing more to load.
    }
  
    setIsLoadingMoreRelated(true);
    try {
      let query = currentRelatedQuery;
      let token: string | undefined | null = relatedVideosNextPageToken;
  
      // If we are chaining relevance, create a new query from the last video.
      if (canChainRelevance) {
        const lastRelatedVideo = relatedVideos[relatedVideos.length - 1];
        query = `More videos about ${lastRelatedVideo.title}`;
        setCurrentRelatedQuery(query); // Persist the new query for subsequent chains
        console.log(`Chaining relevance: new query is "${query}"`);
        token = undefined; // This signals a new search, not a pagination call
      }
  
      if (!query) {
        setIsLoadingMoreRelated(false);
        return;
      }
  
      const { videos: newVideos, nextPageToken: newNextPageToken } = await searchVideos(
        query,
        token
      );
  
      const currentVideoIds = new Set([...relatedVideos.map(v => v.id), selectedVideo.id]);
      const uniqueNewVideos = newVideos.filter(v => !currentVideoIds.has(v.id));
  
      setRelatedVideos(prev => [...prev, ...uniqueNewVideos]);
      setRelatedVideosNextPageToken(newNextPageToken || null);
    } catch (err) {
      console.error('Failed to load more related videos:', err);
    } finally {
      setIsLoadingMoreRelated(false);
    }
  }, [selectedVideo, isLoadingMoreRelated, relatedVideosNextPageToken, relatedVideos, currentRelatedQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const isNearBottom = window.innerHeight + document.documentElement.scrollTop + 800 >= document.documentElement.offsetHeight;
      if (!isNearBottom) return;

      // Logic for main video list (homepage/search)
      if (!selectedVideo && !isLoading && !isLoadingMore) {
        handleLoadMore();
        return; 
      }
      
      // Logic for video detail page
      if (selectedVideo && !isDetailsLoading) {
        // Prioritize loading comments if they are visible, have a next page, and we are on desktop
        if (isCommentsVisible && !!commentsNextPageToken && !isLoadingMoreComments && !isMobile) {
            handleLoadMoreComments();
        } 
        // If no more comments to load (or they are hidden), load related videos
        else if (!isLoadingMoreRelated) {
            handleLoadMoreRelated();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [
    selectedVideo, 
    isLoading, 
    isLoadingMore, 
    isDetailsLoading, 
    isLoadingMoreRelated, 
    isCommentsVisible, 
    commentsNextPageToken, 
    isLoadingMoreComments, 
    handleLoadMore, 
    handleLoadMoreRelated, 
    handleLoadMoreComments,
    isMobile // Add isMobile to dependency array
  ]);


  const handleVideoEnd = useCallback(() => {
    if (!isAutoplayOn) return;

    // Helper to find the next video in the sequence
    const findNextVideo = (): Video | undefined => {
        if (queue.length > 0) {
            const nextInQueue = queue[0];
            setQueue(prev => prev.slice(1));
            return nextInQueue;
        }

        if (selectedVideo) {
            if (relatedVideos.length > 0) {
                return relatedVideos[0];
            }

            const sourceLists = [videos, homePopularVideos, homeRelatedVideos];
            for (const list of sourceLists) {
                const currentIndex = list.findIndex(v => v.id === selectedVideo.id);
                if (currentIndex !== -1 && currentIndex < list.length - 1) {
                    return list[currentIndex + 1];
                }
            }
        }
        return undefined;
    };
    
    const nextVideo = findNextVideo();

    if (nextVideo) {
        if (isMiniPlayerActive) {
            // For mini-player, explicitly set to play and then fetch new data.
            setVideoPlaybackState({ currentTime: 0, isPlaying: true });
            fetchAndSetVideoDetails(nextVideo, { keepMiniPlayer: true });
        } else {
            // For main player, perform the full selection which handles playback state internally.
            handleSelectVideo(nextVideo);
        }
    }
  }, [
      isAutoplayOn, 
      isMiniPlayerActive,
      selectedVideo, 
      relatedVideos, 
      videos, 
      homePopularVideos, 
      homeRelatedVideos, 
      handleSelectVideo,
      fetchAndSetVideoDetails, 
      queue
  ]);
  
  const handleAddToQueue = useCallback((video: Video) => {
    setQueue(prevQueue => {
        if (prevQueue.some(v => v.id === video.id)) {
            return prevQueue;
        }
        return [...prevQueue, video];
    });
  }, []);

  const handleRemoveFromQueue = useCallback((videoId: string) => {
    setQueue(prevQueue => prevQueue.filter(v => v.id !== videoId));
  }, []);

  // Music Player Handlers
  const handlePlayMusic = useCallback(async (video: Video, playlist: Video[]) => {
    const trackIndex = playlist.findIndex(v => v.id === video.id);
    if (trackIndex === -1) return;

    if (isNative) {
        setVideoPlaybackState(prev => ({ ...prev, isPlaying: false })); // Pause video if playing
        setMusicPlaylist([]);
        setCurrentMusicTrackIndex(-1);
        setIsMusicPlaying(false);

        setNativePlaylist(playlist);
        await nativeAudioService.setPlaylist(playlist, trackIndex);

    } else { // Web player logic
        setMusicPlaylist(playlist);
        setCurrentMusicTrackIndex(trackIndex);
        setIsMusicPlaying(true);
        if (selectedVideo) {
            // If watching a video, don't close it, just start music.
        } else {
            setSelectedVideo(null);
        }
    }
  }, [isNative, selectedVideo]);

  const handleToggleMusicPlay = useCallback(() => {
    if (isNative) {
        nativePlayerState.isPlaying ? nativeAudioService.pause() : nativeAudioService.play();
    } else {
        if (currentMusicTrackIndex > -1) {
            setIsMusicPlaying(prev => !prev);
        }
    }
  }, [isNative, nativePlayerState.isPlaying, currentMusicTrackIndex]);

  const handleNextTrack = useCallback(() => {
     if (isNative) {
        nativeAudioService.next();
     } else {
        if (musicPlaylist.length > 0) {
            const nextIndex = (currentMusicTrackIndex + 1) % musicPlaylist.length;
            setCurrentMusicTrackIndex(nextIndex);
            setIsMusicPlaying(true);
        }
     }
  }, [isNative, musicPlaylist, currentMusicTrackIndex]);

  const handlePrevTrack = useCallback(() => {
    if (isNative) {
        nativeAudioService.previous();
    } else {
        if (musicPlaylist.length > 0) {
            const prevIndex = (currentMusicTrackIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
            setCurrentMusicTrackIndex(prevIndex);
            setIsMusicPlaying(true);
        }
    }
  }, [isNative, musicPlaylist, currentMusicTrackIndex]);
  
  const handleCloseMusicPlayer = useCallback(() => {
    if (isNative) {
        nativeAudioService.destroy();
        setNativePlaylist([]);
        setNativePlayerState({ isPlaying: false, currentTrackId: null });
    } else {
        setIsMusicPlaying(false);
        setCurrentMusicTrackIndex(-1);
        setMusicPlaylist([]);
    }
  }, [isNative]);

  // Memoized values for rendering music players
  const currentMusicTrack = currentMusicTrackIndex > -1 ? musicPlaylist[currentMusicTrackIndex] : null;

  const currentNativeTrack = useMemo(() => {
    if (!nativePlayerState.currentTrackId || nativePlaylist.length === 0) {
        return null;
    }
    return nativePlaylist.find(v => v.id === nativePlayerState.currentTrackId) || null;
  }, [nativePlayerState.currentTrackId, nativePlaylist]);


  // Video Player Handlers
    const handlePlaybackStateChange = useCallback((newState: Partial<{ currentTime: number, isPlaying: boolean }>) => {
        setVideoPlaybackState(prev => ({ ...prev, ...newState }));
    }, []);

    const handleToggleVideoPlay = useCallback(() => {
        setVideoPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }, []);

    const handleCloseMiniPlayer = useCallback(() => {
        setIsMiniPlayerActive(false);
        setSelectedVideo(null);
        setVideoPlaybackState({ currentTime: 0, isPlaying: false });
    }, []);

    const handleExpandMiniPlayer = useCallback(() => {
        if (selectedVideo) {
            setVideoPlaybackState(prev => ({ ...prev, isPlaying: true }));
            setIsMiniPlayerActive(false);
            history.pushState({ type: 'video', videoId: selectedVideo.id }, '', `/?watch=${selectedVideo.id}`);
        }
    }, [selectedVideo]);
    
    // Comments to display based on device
    const commentsToShow = useMemo(() => 
        isMobile ? comments.slice(0, mobileCommentsPage * 5) : comments,
        [isMobile, comments, mobileCommentsPage]
    );
    const hasMoreCommentsMobile = useMemo(() => 
        mobileCommentsPage * 5 < comments.length || !!commentsNextPageToken,
        [mobileCommentsPage, comments.length, commentsNextPageToken]
    );

  const renderMainContent = () => {
    if (error && !selectedVideo) {
      return <div className="text-center p-8 text-youtube-red">{error}</div>;
    }
    
    if (selectedVideo && !isMiniPlayerActive) {
      return (
        <div className="container mx-auto max-w-screen-2xl p-4 lg:flex lg:space-x-4">
          <div className="lg:w-2/3">
            <VideoPlayer 
                key={selectedVideo.id} 
                video={selectedVideo} 
                onVideoEnd={handleVideoEnd}
                isPlaying={videoPlaybackState.isPlaying && !isMusicPlaying && !(isNative && nativePlayerState.isPlaying)}
                onPlaybackStateChange={handlePlaybackStateChange}
                initialTime={videoPlaybackState.currentTime}
                durationInSeconds={parseDurationToSeconds(selectedVideo.duration)}
            />
            <VideoDetail video={selectedVideo} isLoading={isDetailsLoading} />
            <div className="mt-6">
                <div className="flex items-center space-x-4 mb-4">
                    <h2 className="text-lg font-bold">
                        {isDetailsLoading
                            ? 'Loading comments...'
                            : selectedVideo?.commentCount !== undefined
                                ? `${new Intl.NumberFormat('en-US').format(selectedVideo.commentCount)} Comments`
                                : 'Comments'
                        }
                    </h2>
                    <button 
                        onClick={() => setIsCommentsVisible(!isCommentsVisible)} 
                        className="text-youtube-text-secondary hover:text-youtube-text-primary"
                        aria-label={isCommentsVisible ? "Hide comments" : "Show comments"}
                    >
                        <ChevronDownIcon className={`w-6 h-6 transition-transform ${isCommentsVisible ? '' : '-rotate-180'}`} />
                    </button>
                </div>
                {isCommentsVisible && (
                    <CommentSection 
                        comments={commentsToShow} 
                        isLoading={isDetailsLoading}
                        isLoadingMore={isLoadingMoreComments}
                        isMobile={isMobile}
                        hasMore={hasMoreCommentsMobile}
                        onLoadMore={handleLoadMoreCommentsMobile}
                    />
                )}
            </div>
          </div>
          <div className="lg:w-1/3 mt-4 lg:mt-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Up next</h2>
              <AutoplayToggle isOn={isAutoplayOn} onToggle={() => setIsAutoplayOn(!isAutoplayOn)} />
            </div>
             {queue.length > 0 && (
                <div className="mb-4 border-b border-youtube-dark-tertiary pb-4">
                    <h3 className="text-lg font-semibold mb-2 px-2">Queue</h3>
                    <VideoList
                        videos={queue}
                        onVideoSelect={handleSelectVideo}
                        layout="list"
                        isQueue={true}
                        onRemoveFromQueue={handleRemoveFromQueue}
                        currentVideoId={selectedVideo.id}
                    />
                </div>
            )}
            <VideoList 
              videos={relatedVideos.filter(v => !queue.some(qv => qv.id === v.id))} 
              onVideoSelect={handleSelectVideo} 
              layout="list"
              isLoading={isDetailsLoading}
              isLoadingMore={isLoadingMoreRelated}
              currentVideoId={selectedVideo.id}
              onAddToQueue={handleAddToQueue}
              onPlayMusic={(video) => handlePlayMusic(video, relatedVideos)}
            />
          </div>
        </div>
      );
    }

    // Homepage View
    if (!currentQuery) {
        return (
            <div className="container mx-auto p-4 space-y-12">
                { (isLoading || homeRelatedVideos.length > 0) && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
                        <VideoList
                            videos={homeRelatedVideos}
                            onVideoSelect={handleSelectVideo}
                            layout="grid"
                            isLoading={isLoading && homeRelatedVideos.length === 0}
                            onAddToQueue={handleAddToQueue}
                            onPlayMusic={(video) => handlePlayMusic(video, homeRelatedVideos)}
                        />
                    </section>
                )}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
                    <VideoList
                        videos={homePopularVideos}
                        onVideoSelect={handleSelectVideo}
                        layout="grid"
                        isLoading={isLoading && homePopularVideos.length === 0}
                        onAddToQueue={handleAddToQueue}
                        onPlayMusic={(video) => handlePlayMusic(video, homePopularVideos)}
                        isLoadingMore={isLoadingMore}
                    />
                </section>
            </div>
        );
    }
    
    // Search Results View
    return (
        <div className="container mx-auto p-4">
            <VideoList 
              videos={videos} 
              onVideoSelect={handleSelectVideo} 
              layout="grid"
              isLoading={isLoading}
              onAddToQueue={handleAddToQueue}
              onPlayMusic={(video) => handlePlayMusic(video, videos)}
              isLoadingMore={isLoadingMore}
            />
        </div>
    );
  };

  const isMusicPlayerVisible = (!isNative && currentMusicTrack) || (isNative && currentNativeTrack);

  return (
    <div className="min-h-screen bg-youtube-dark">
      <Header 
        onSearch={handleHeaderSearch}
        onSearchClick={() => setIsSearchOpen(true)} 
        onLogoClick={handleLogoClick}
        searchInputValue={searchInputValue}
        onSearchInputChange={setSearchInputValue}
        searchHistory={searchHistory}
        onClearHistory={clearSearchHistory}
        onRemoveHistoryItem={handleRemoveFromSearchHistory}
      />
      <main className={`pt-16 transition-all duration-300 ${isMusicPlayerVisible ? 'pb-24 md:pb-20' : ''}`}>
        {renderMainContent()}
      </main>
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSearch={handleSearch}
        searchHistory={searchHistory}
        onClearHistory={clearSearchHistory}
        onApplyHistoryItem={handleApplyHistoryItem}
        searchInputValue={searchInputValue}
        onSearchInputChange={setSearchInputValue}
        onRemoveHistoryItem={handleRemoveFromSearchHistory}
      />
      {isMiniPlayerActive && selectedVideo && (
        <MiniPlayer 
            key={selectedVideo.id}
            video={selectedVideo}
            isPlaying={videoPlaybackState.isPlaying && !isMusicPlaying && !(isNative && nativePlayerState.isPlaying)}
            initialTime={videoPlaybackState.currentTime}
            onTogglePlay={handleToggleVideoPlay}
            onClose={handleCloseMiniPlayer}
            onExpand={handleExpandMiniPlayer}
            onStateChange={handlePlaybackStateChange}
            onVideoEnd={handleVideoEnd}
            durationInSeconds={parseDurationToSeconds(selectedVideo.duration)}
        />
      )}
      {!isNative && currentMusicTrack && (
          <MusicPlayer
              track={currentMusicTrack}
              isPlaying={isMusicPlaying}
              onTogglePlay={handleToggleMusicPlay}
              onNext={handleNextTrack}
              onPrev={handlePrevTrack}
              onClose={handleCloseMusicPlayer}
              onTrackEnd={handleNextTrack}
          />
      )}
      {isNative && currentNativeTrack && (
          <NativeMusicPlayer
              track={currentNativeTrack}
              isPlaying={nativePlayerState.isPlaying}
              onTogglePlay={handleToggleMusicPlay}
              onNext={handleNextTrack}
              onPrev={handlePrevTrack}
              onClose={handleCloseMusicPlayer}
          />
      )}
    </div>
  );
};

export default App;