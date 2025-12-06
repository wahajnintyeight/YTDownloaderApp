declare module 'react-native-youtube-bridge' {
  import { ComponentType } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface YouTubePlayer {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seekTo: (time: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    mute: () => void;
    unMute: () => void;
    getDuration: () => Promise<number>;
    getCurrentTime: () => Promise<number>;
    getVolume: () => Promise<number>;
  }

  export interface YouTubePlayerOptions {
    autoplay?: boolean;
    controls?: boolean;
    playsinline?: boolean;
    rel?: boolean;
    muted?: boolean;
    loop?: boolean;
    start?: number;
    end?: number;
  }

  export interface YoutubeViewProps {
    player: YouTubePlayer;
    height?: number;
    width?: number;
    style?: StyleProp<ViewStyle>;
    webViewStyle?: StyleProp<ViewStyle>;
    webViewProps?: any;
    iframeStyle?: any;
    useInlineHtml?: boolean;
    webViewUrl?: string;
  }

  export const YoutubeView: ComponentType<YoutubeViewProps>;

  export function useYouTubePlayer(
    videoIdOrUrl: string,
    options?: YouTubePlayerOptions
  ): YouTubePlayer;

  export function useYouTubeEvent<T = any>(
    player: YouTubePlayer,
    event: string,
    defaultValueOrInterval?: T | number,
    callback?: (data: T) => void,
    deps?: any[]
  ): T;

  export function useYoutubeOEmbed(url: string): {
    oEmbed: any;
    isLoading: boolean;
    error: Error | null;
  };
}

