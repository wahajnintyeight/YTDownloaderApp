# YT Downloader 🎬

A modern, feature-rich YouTube video downloader built with React Native and TypeScript. Search, preview, and download YouTube videos with a beautiful, intuitive interface.

## ✨ Features

### 🎨 Modern UI/UX
- **Dark/Light Theme Support** - Automatic system theme detection with manual toggle
- **Vibrant Color Palette** - Eye-catching design with professional aesthetics
- **Smooth Animations** - 60fps performance with React Native Reanimated
- **Custom Icons** - Minimalistic, geometric search icon designed for 2025

### 🔍 Video Search
- **Real-time Search** - Search YouTube videos with instant results
- **Pagination Support** - Load more results with infinite scroll
- **API Integration** - Connects to YouTube Data API v3 via backend service
- **Mock Data Fallback** - Works offline with sample data for testing
- **Search History** - Maintains search state and results

### 📱 User Interface
- **Professional Header** - Modern app header with branding and theme toggle
- **Responsive Search Bar** - Large, accessible search input with custom button
- **Video Cards** - Rich video previews with thumbnails, titles, and metadata
- **Loading States** - Beautiful loading animations for all async operations
- **Error Handling** - User-friendly error messages with retry options

### 🎯 Download System (UI Ready)
- **Download Modal** - Comprehensive download configuration interface
- **Format Selection** - Choose from MP4, MP3, WEBM, MKV formats
- **Quality Options** - Multiple quality settings from 144p to 2160p + audio-only
- **Progress Tracking** - Real-time download progress indicators
- **State Management** - Robust download queue and status management

### 🏗️ Technical Excellence
- **TypeScript** - Full type safety and IntelliSense support
- **Context API** - Efficient state management for theme and downloads
- **Custom Hooks** - Reusable logic for search, downloads, and theming
- **Performance Optimized** - Memoized components and optimized FlatList rendering
- **Error Boundaries** - Comprehensive error handling and recovery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wahajnintyeight/YTDownloaderApp.git
   cd YTDownloaderApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

### Development

1. **Start Metro bundler**
   ```bash
   npm start
   ```

2. **Run on Android**
   ```bash
   npm run android
   ```

3. **Run on iOS**
   ```bash
   npm run ios
   ```

### Building Standalone APK

For testing without the development server:

```bash
# Build and install debug APK
./build-and-install.sh

# Build and install release APK
./build-and-install.sh release
```

## 🏛️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── AppHeader.tsx   # Modern app header with theme toggle
│   ├── SearchBar.tsx   # Custom search input with icon
│   ├── SearchIcon.tsx  # Minimalistic geometric search icon
│   ├── VideoResultCard.tsx # Video preview cards
│   ├── DownloadModal.tsx   # Download configuration modal
│   └── LoadingAnimation.tsx # Custom loading states
├── hooks/              # Custom React hooks
│   ├── useTheme.tsx    # Theme management and switching
│   ├── useSearch.ts    # Search functionality and state
│   └── useDownloads.tsx # Download queue management
├── screens/            # App screens
│   ├── SplashScreen.tsx # Animated splash screen
│   └── BrowseScreen.tsx # Main search and results screen
├── services/           # API and external services
│   ├── apiClient.ts    # HTTP client with retry logic
│   └── mockData.ts     # Sample data for testing
├── types/              # TypeScript type definitions
├── theme/              # Theme system (colors, typography, spacing)
└── utils/              # Utility functions
```

### Key Technologies
- **React Native 0.82** - Cross-platform mobile framework
- **TypeScript 5.8** - Type-safe JavaScript
- **React Navigation 6** - Navigation library
- **React Native Reanimated 3** - High-performance animations
- **Axios** - HTTP client with interceptors
- **Context API** - State management

## 🎨 Design System

### Color Palette
- **Primary**: `#FF6B6B` (Vibrant Red)
- **Secondary**: `#4ECDC4` (Vibrant Teal)  
- **Accent**: `#FFE66D` (Vibrant Yellow)
- **Success**: `#00B894` (Green)
- **Error**: `#FF3838` (Red)

### Typography Scale
- **H1**: 32px, Bold (700)
- **H2**: 24px, Semi-Bold (600)
- **H3**: 18px, Semi-Bold (600)
- **Body**: 16px, Regular (400)
- **Caption**: 14px, Regular (400)

### Spacing System
- **XS**: 4px
- **SM**: 8px  
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **XXL**: 48px

## 🔧 Configuration

### API Integration
The app connects to a backend service for YouTube video search:

```typescript
// API Base URL
const BASE_URL = 'https://api.theprojectphoenix.top/v2/api';

// Endpoints
POST /search-yt-videos  // Search for videos
POST /download-yt-videos // Download videos (backend feature)
```

### Environment Setup
The app automatically falls back to mock data when the backend is unavailable, ensuring a smooth development experience.

## 📱 Screenshots

### Light Mode
- Modern header with app branding
- Clean search interface with custom icon
- Rich video cards with thumbnails and metadata
- Professional download modal with format selection

### Dark Mode  
- Automatic theme switching
- Consistent dark theme across all components
- High contrast for accessibility
- Vibrant accent colors maintained

## 🚧 Upcoming Features

### Download Implementation
- [ ] **File System Integration** - Save videos to device storage
- [ ] **Background Downloads** - Continue downloads when app is backgrounded
- [ ] **Download Manager** - Queue management and concurrent downloads
- [ ] **Progress Notifications** - System notifications for download status
- [ ] **Download History** - Track completed downloads

### Enhanced Features
- [ ] **Playlist Support** - Download entire YouTube playlists
- [ ] **Subtitle Downloads** - Include video subtitles
- [ ] **Quality Auto-Selection** - Smart quality selection based on network
- [ ] **Share Integration** - Share videos with other apps
- [ ] **Storage Management** - Monitor and manage storage usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Native Community** - For the amazing framework and tools
- **YouTube Data API** - For providing video search capabilities
- **Design Inspiration** - Modern mobile app design trends for 2025

---

**Built with ❤️ using React Native and TypeScript**

*Ready for 2025 with modern design, robust architecture, and exceptional user experience.*