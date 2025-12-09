// Minimal YouTube IFrame API types for TypeScript

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YTNamespace {
  Player: new (
    elementId: string,
    options: YTPlayerOptions
  ) => YTPlayer;
}

export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
}

export interface YTPlayerOptions {
  height?: string;
  width?: string;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
  };
  events?: {
    onReady?: (event: unknown) => void;
    onStateChange?: (event: unknown) => void;
  };
}

export {};
