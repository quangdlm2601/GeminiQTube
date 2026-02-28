import { Capacitor } from '@capacitor/core';
import { Playlist } from '@openstream/capacitor-playlist';
import { getAudioStream } from '../services/geminiService';
import type { Video } from './types';

// Manually define the type to fix compilation issues with the package's type definitions.
interface CapacitorPlaylistItem {
    trackId: string;
    title: string;
    artist?: string;
    album?: string;
    albumArt?: string;
    audio: string;
}

class NativeAudioService {
    private isInitialized = false;
    private eventListeners: { [key: string]: ((data: any) => void)[] } = {};

    constructor() {
        if (this.isNative()) {
            this.initializePlugin();
        }
    }
    
    isNative(): boolean {
        return Capacitor.isNativePlatform();
    }

    private async initializePlugin() {
        try {
            await Playlist.initialize();
            
            Playlist.addListener('trackEnded', (info) => this.emit('trackEnded', info));
            Playlist.addListener('trackChanged', (info) => this.emit('trackChanged', info));
            Playlist.addListener('playbackStateChanged', (info) => this.emit('playbackStateChanged', info));
            
            // Listen for remote control events from lock screen/notification
            Playlist.addListener('remotePlay', () => this.play());
            Playlist.addListener('remotePause', () => this.pause());
            Playlist.addListener('remoteNext', () => this.next());
            Playlist.addListener('remotePrevious', () => this.previous());
            Playlist.addListener('remoteStop', () => this.destroy());
            Playlist.addListener('remoteSeek', (info) => this.seek(info.position));

            this.isInitialized = true;
            console.log('Capacitor Playlist plugin initialized.');
        } catch (e) {
            console.error('Failed to initialize Capacitor Playlist plugin', e);
        }
    }

    private emit(eventName: string, data: any) {
        this.eventListeners[eventName]?.forEach(callback => callback(data));
    }

    addEventListener(eventName: string, callback: (data: any) => void) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    removeEventListener(eventName: string, callback: (data: any) => void) {
        this.eventListeners[eventName] = this.eventListeners[eventName]?.filter(cb => cb !== callback);
    }
    
    private async buildPlaylistItem(video: Video): Promise<CapacitorPlaylistItem> {
        try {
            const { streamUrl } = await getAudioStream(video.id);
            return {
                trackId: video.id,
                title: video.title,
                artist: video.channelName,
                album: 'GeminiQTube',
                albumArt: video.thumbnailUrl,
                audio: streamUrl,
            };
        } catch (error) {
            console.error(`Failed to build playlist item for video ${video.id}`, error);
            throw new Error(`Could not get audio for "${video.title}"`);
        }
    }

    async setPlaylist(videos: Video[], startIndex: number = 0) {
        if (!this.isNative() || !this.isInitialized) return;

        console.log(`Setting native playlist with ${videos.length} videos, starting at index ${startIndex}`);

        try {
            const playlistItems = await Promise.all(videos.map(v => this.buildPlaylistItem(v)));
            
            await Playlist.setPlaylist({ items: playlistItems });
            await Playlist.playTrack({ index: startIndex });
            this.emit('playbackStateChanged', { isPlaying: true });

        } catch (error) {
            console.error('Failed to set native playlist', error);
            this.emit('error', error);
        }
    }

    async play() {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.play();
    }
    
    async pause() {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.pause();
    }
    
    async next() {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.skipToNext();
    }

    async previous() {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.skipToPrevious();
    }

    async seek(position: number) {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.seek({ position });
    }

    async destroy() {
        if (!this.isNative() || !this.isInitialized) return;
        await Playlist.destroy();
        this.isInitialized = false;
        // Re-initialize for future use without needing a full app reload
        this.initializePlugin();
        console.log('Capacitor Playlist destroyed and re-initializing.');
    }
}

// Export a singleton instance
export const nativeAudioService = new NativeAudioService();