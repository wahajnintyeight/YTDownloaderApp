declare module 'react-native-youtube-iframe' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  interface YoutubeIframeProps {
    videoId: string;
    height: number;
    width?: number;
    play?: boolean;
    mute?: boolean;
    volume?: number;
    playbackRate?: number;
    onChangeState?: (state: string) => void;
    onReady?: () => void;
    onError?: (error: string) => void;
    onPlaybackQualityChange?: (quality: string) => void;
    onPlaybackRateChange?: (rate: number) => void;
    initialPlayerParams?: {
      loop?: boolean;
      controls?: boolean;
      cc_lang_pref?: string;
      showClosedCaptions?: boolean;
      color?: 'red' | 'white';
      start?: number;
      end?: number;
      preventFullScreen?: boolean;
      playerLang?: string;
      iv_load_policy?: number;
      modestbranding?: boolean;
      rel?: boolean;
    };
    webViewStyle?: ViewStyle;
    webViewProps?: Record<string, unknown>;
    allowWebViewZoom?: boolean;
    forceAndroidAutoplay?: boolean;
    contentScale?: number;
  }

  const YoutubeIframe: ComponentType<YoutubeIframeProps>;
  export default YoutubeIframe;
}
