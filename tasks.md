# Implementation Plan

## Backend Setup and Core Infrastructure

- [ ] 1. Initialize Go backend project structure
  - Create Go module with proper directory structure (cmd, internal, pkg)
  - Set up main.go entry point with basic HTTP server
  - Configure environment variable loading with godotenv
  - Create Dockerfile with yt-dlp and ffmpeg dependencies
  - _Requirements: 10.1, 11.1_

- [ ] 2. Implement HTTP router and middleware
  - Set up Gin router with CORS middleware
  - Implement request logging middleware
  - Implement error handling middleware with standardized error responses
  - Add rate limiting middleware (100 requests/minute per IP)
  - _Requirements: 10.1, 11.1_

- [ ] 3. Create data models and DTOs
  - Define Video struct with JSON tags
  - Define SearchRequest and SearchResponse structs with validation tags
  - Define DownloadRequest struct with validation tags
  - Define Format struct for available video formats
  - Define ErrorResponse struct for consistent error handling
  - _Requirements: 10.2, 10.3, 11.2, 11.3_

## YouTube API Integration

- [ ] 4. Implement YouTube API service
  - Create YouTubeService interface with Search and GetVideoDetails methods
  - Implement YouTube Data API v3 client initialization
  - Implement Search method that queries YouTube API with proper error handling
  - Parse YouTube API responses and map to Video structs
  - Extract video ID, title, thumbnail URL, duration, channel name, and view count
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 5. Write unit tests for YouTube service
  - Mock YouTube API responses
  - Test successful search with various queries
  - Test empty results handling
  - Test API error scenarios
  - Test response parsing and data extraction
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [ ] 6. Implement search endpoint handler
  - Create POST /api/v1/search endpoint
  - Validate search query parameter (non-empty, max length)
  - Call YouTubeService.Search with query
  - Format response as JSON with video array
  - Handle validation errors (400), API errors (502/503), and empty results (200)
  - _Requirements: 10.1, 10.7, 10.8, 10.9, 10.10_

## yt-dlp Integration

- [ ] 7. Implement yt-dlp wrapper service
  - Create DownloadService interface with GetAvailableFormats and DownloadVideo methods
  - Implement command builder for yt-dlp with format and quality parameters
  - Implement GetAvailableFormats method that executes yt-dlp --list-formats
  - Parse yt-dlp format output into Format structs
  - Implement URL validation and sanitization
  - _Requirements: 11.2, 11.3, 11.4_

- [ ] 8. Implement video download streaming
  - Implement DownloadVideo method that executes yt-dlp with streaming output
  - Set up command with proper format selection based on request parameters
  - Return io.ReadCloser for streaming file blob
  - Implement timeout protection (30 minutes)
  - Handle yt-dlp errors and map to appropriate HTTP errors
  - _Requirements: 11.4, 11.5, 11.6, 11.10, 11.11_

- [ ] 9. Write unit tests for download service
  - Mock yt-dlp command execution
  - Test format list parsing
  - Test download command construction with various formats and qualities
  - Test error handling for invalid URLs
  - Test timeout scenarios
  - _Requirements: 11.2, 11.3, 11.4, 11.10, 11.11_

- [ ] 10. Implement download endpoint handler
  - Create POST /api/v1/download endpoint
  - Validate request parameters (URL format, format enum, quality)
  - Call DownloadService.DownloadVideo with validated parameters
  - Stream file blob with proper Content-Type and Content-Disposition headers
  - Set appropriate filename based on video title and format
  - Handle validation errors (400), processing errors (500), and not found (404)
  - _Requirements: 11.1, 11.7, 11.8, 11.9, 11.10, 11.11_

## Backend Testing and Integration

- [ ] 11. Write integration tests for backend endpoints
  - Test search endpoint with real YouTube API (or mocked)
  - Test download endpoint with sample video URL
  - Test error scenarios (invalid URLs, missing parameters)
  - Test concurrent download requests
  - Test rate limiting behavior
  - _Requirements: 10.1-10.10, 11.1-11.11_

## React Native Project Setup

- [ ] 12. Initialize React Native project without Expo
  - Create React Native project using react-native CLI
  - Configure TypeScript with strict mode
  - Set up project structure (src/screens, src/components, src/services, src/hooks, src/types, src/theme)
  - Configure Metro bundler
  - Set up iOS and Android build configurations
  - _Requirements: 1.1, 2.1_

- [ ] 13. Install and configure core dependencies
  - Install React Navigation (stack, bottom tabs)
  - Install react-native-reanimated for animations
  - Install lottie-react-native for loading animations
  - Install react-native-fast-image for image caching
  - Install axios for HTTP requests
  - Install react-native-fs for file system operations
  - Install @react-native-async-storage/async-storage for local storage
  - Configure native modules for iOS and Android
  - _Requirements: 1.1, 2.1, 12.3_

## Theme System Implementation

- [ ] 14. Create theme system with dark/light mode support
  - Define ColorPalette interface with all color tokens
  - Create light and dark color palettes with vibrant colors
  - Define typography scale (h1, h2, h3, body, caption, button)
  - Define spacing system (xs, sm, md, lg, xl, xxl)
  - Create Theme interface combining colors, typography, and spacing
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [ ] 15. Implement ThemeProvider and useTheme hook
  - Create ThemeContext with React Context API
  - Implement ThemeProvider component that detects system theme
  - Implement useTheme hook to access current theme and colors
  - Add listener for system theme changes
  - Implement theme switching logic
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7, 9.8_

- [ ] 16. Write unit tests for theme system
  - Test theme detection on mount
  - Test theme switching when system theme changes
  - Test color palette selection based on theme mode
  - Test useTheme hook returns correct values
  - _Requirements: 9.1-9.8_

## State Management Setup

- [ ] 17. Create download state management with Context API
  - Define Download interface with id, video, format, quality, status, progress, filePath, error
  - Define DownloadAction types (START, UPDATE_PROGRESS, COMPLETE, FAIL, CANCEL)
  - Implement downloadReducer with all action handlers
  - Create DownloadContext and DownloadProvider
  - _Requirements: 6.1, 6.7, 7.2, 7.3, 7.7_

- [ ] 18. Implement useDownloads hook
  - Create useDownloads hook that accesses DownloadContext
  - Implement startDownload function that dispatches START action
  - Implement updateProgress function for progress updates
  - Implement completeDownload function
  - Implement failDownload function with error message
  - Implement cancelDownload function
  - _Requirements: 6.7, 6.8, 7.2, 7.3, 7.7, 7.8, 7.9_

## API Client Implementation

- [ ] 19. Create API client service
  - Configure axios instance with base URL from environment
  - Implement searchVideos function that calls POST /api/v1/search
  - Implement downloadVideo function that calls POST /api/v1/download with streaming
  - Add request/response interceptors for logging
  - Implement error handling with retry logic (exponential backoff)
  - _Requirements: 3.1, 3.6, 6.1, 6.2, 12.5_

- [ ] 20. Implement download manager service
  - Create DownloadManager class to handle concurrent downloads
  - Implement queue system with concurrency limit (3 concurrent)
  - Implement download function that streams file and saves to device
  - Implement progress tracking with callbacks
  - Implement file saving with react-native-fs
  - Handle background download continuation
  - _Requirements: 6.5, 6.6, 6.7, 7.2, 7.3, 7.7, 12.6_

- [ ] 21. Write unit tests for API client and download manager
  - Mock axios requests and responses
  - Test successful search and download requests
  - Test error handling and retry logic
  - Test download queue management
  - Test concurrent download limits
  - Test progress tracking
  - _Requirements: 3.1, 3.6, 6.1-6.11, 12.5_

## Navigation Setup

- [ ] 22. Implement app navigation structure
  - Create AppNavigator with Stack Navigator
  - Create SplashScreen component (placeholder)
  - Create BrowseScreen component (placeholder)
  - Configure navigation from Splash to Browse
  - Set up navigation types for type-safe navigation
  - _Requirements: 1.3, 2.1_

## Splash Screen Implementation

- [ ] 23. Implement SplashScreen with animations
  - Create SplashScreen component with vibrant background
  - Add app logo and branding elements
  - Implement fade-in animation using react-native-reanimated
  - Implement app initialization logic (check permissions, load cache)
  - Add loading indicator for long initialization (>2 seconds)
  - Apply theme-aware colors
  - Implement automatic navigation to BrowseScreen after initialization
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 24. Write component tests for SplashScreen
  - Test component renders with correct branding
  - Test animation plays on mount
  - Test navigation to BrowseScreen after initialization
  - Test loading indicator appears after 2 seconds
  - Test theme colors are applied correctly
  - _Requirements: 1.1-1.5_

## Search UI Implementation

- [ ] 25. Create SearchBar component
  - Implement SearchBar with TextInput and search icon
  - Style with theme colors, border radius, and padding
  - Add placeholder text "Search YouTube videos"
  - Implement keyboard focus on tap
  - Add clear button when text is present
  - Implement debounced input (300ms) to avoid excessive API calls
  - Add submit handler for search action
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 26. Create LoadingAnimation component
  - Integrate Lottie animations for loading states
  - Create different animation types (search, download, general)
  - Apply vibrant colors matching theme
  - Implement smooth 60fps animations
  - Add visibility prop to show/hide
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

- [ ] 27. Implement useSearch custom hook
  - Create useSearch hook with state for results, loading, error
  - Implement search function that calls API client
  - Handle loading state during API call
  - Handle error state with user-friendly messages
  - Cache search results for current session
  - Return search function and state values
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8_

## Search Results Display

- [ ] 28. Create VideoResultCard component
  - Implement card layout with thumbnail, title, duration, channel name
  - Use react-native-fast-image for thumbnail with placeholder
  - Format duration as MM:SS or HH:MM:SS
  - Style with theme colors and vibrant design
  - Add press handler with visual feedback
  - Implement fallback placeholder for failed thumbnails
  - Optimize with React.memo for performance
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 4.10_

- [ ] 29. Implement BrowseScreen with search and results
  - Create BrowseScreen layout with SearchBar at top
  - Implement search submission handler with validation
  - Display validation message for empty queries
  - Integrate useSearch hook for search functionality
  - Display LoadingAnimation during search
  - Render FlatList of VideoResultCard components for results
  - Optimize FlatList with windowSize, maxToRenderPerBatch, getItemLayout
  - Display "No results found" message when appropriate
  - Display error message with retry option on failure
  - Ensure 60fps scrolling performance
  - _Requirements: 2.1-2.7, 3.1-3.8, 4.1, 4.7, 4.9_

- [ ] 30. Write component tests for search UI
  - Test SearchBar input and submission
  - Test search validation for empty queries
  - Test VideoResultCard rendering with mock data
  - Test BrowseScreen displays loading state
  - Test BrowseScreen displays results
  - Test BrowseScreen displays error messages
  - Test BrowseScreen displays "No results found"
  - _Requirements: 2.1-2.7, 3.1-3.8, 4.1-4.10_

## Download Modal Implementation

- [ ] 31. Create DownloadModal component structure
  - Create modal component with backdrop and content area
  - Style with theme colors, border radius, and padding
  - Implement modal visibility control with visible prop
  - Add close handler for backdrop tap and close button
  - Display video thumbnail and title at top
  - Apply vibrant styling consistent with app theme
  - _Requirements: 5.1, 5.2, 5.11, 5.12_

- [ ] 32. Implement format and quality selectors
  - Create format selector with options (MP4, MP3, WEBM, MKV)
  - Create quality selector with options (144p-2160p, audio_only)
  - Implement selection state management
  - Highlight selected options with theme colors
  - Update UI when selections change
  - _Requirements: 5.3, 5.4, 5.6, 5.7_

- [ ] 33. Implement download location picker
  - Create location selector component
  - Display current selected location
  - Implement location picker dialog (use device file picker)
  - Update displayed location when changed
  - _Requirements: 5.5, 5.8_

- [ ] 34. Implement download button and validation
  - Create download button with theme styling
  - Enable button only when all required options are selected
  - Disable button when options are missing
  - Add loading state to button during download initiation
  - Implement download button press handler
  - _Requirements: 5.9, 5.10_

- [ ] 35. Integrate download functionality in modal
  - Connect download button to useDownloads hook
  - Call startDownload with video, format, quality, and location
  - Display loading indicator in modal during download start
  - Show download progress percentage
  - Display success message on completion
  - Close modal automatically on success
  - Display error message with retry option on failure
  - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8, 6.9, 6.10_

- [ ] 36. Write component tests for DownloadModal
  - Test modal opens and closes correctly
  - Test format and quality selection
  - Test download button enable/disable logic
  - Test download initiation
  - Test progress display
  - Test success and error states
  - _Requirements: 5.1-5.12, 6.1-6.10_

## Background Downloads Implementation

- [ ] 37. Implement background download indicator
  - Create DownloadIndicator component for active downloads
  - Display download count and overall progress
  - Position indicator in UI (bottom of screen or header)
  - Update in real-time as downloads progress
  - Make indicator tappable to show download details
  - _Requirements: 7.3, 7.4_

- [ ] 38. Implement download notifications
  - Integrate local notification system (react-native-push-notification or similar)
  - Send notification when background download completes
  - Send notification when background download fails with error details
  - Include video title and status in notification
  - _Requirements: 7.8, 7.9_

- [ ] 39. Implement concurrent download handling
  - Ensure multiple downloads can run simultaneously
  - Update download state for each download independently
  - Handle download queue when limit is reached
  - Test with multiple simultaneous downloads
  - _Requirements: 7.5, 7.6, 7.7_

- [ ] 40. Test background download scenarios
  - Test closing modal during download continues download
  - Test navigating away during download
  - Test initiating new search during download
  - Test starting multiple downloads
  - Test app backgrounding during download
  - Test app returning to foreground updates UI
  - _Requirements: 7.1-7.9, 12.6, 12.7_

## Performance Optimizations

- [ ] 41. Implement image loading optimizations
  - Configure react-native-fast-image with cache settings
  - Implement lazy loading for images in FlatList
  - Add image compression for thumbnails
  - Test image loading performance
  - _Requirements: 12.3_

- [ ] 42. Optimize list rendering performance
  - Fine-tune FlatList props (windowSize, initialNumToRender, maxToRenderPerBatch)
  - Implement getItemLayout for fixed-height items
  - Use React.memo for VideoResultCard
  - Test scrolling maintains 60fps
  - _Requirements: 4.7, 12.2_

- [ ] 43. Implement state management optimizations
  - Use useMemo for expensive computations
  - Use useCallback for event handlers
  - Split context providers to minimize re-renders
  - Test performance with React DevTools Profiler
  - _Requirements: 12.1, 12.2_

## Error Handling and Edge Cases

- [ ] 44. Implement comprehensive error handling
  - Create centralized ErrorHandler utility
  - Map error types to user-friendly messages
  - Implement retry logic with exponential backoff for network errors
  - Add error boundaries for React components
  - Test various error scenarios (network, API, validation, download)
  - _Requirements: 3.6, 6.10, 12.5_

- [ ] 45. Handle edge cases and validation
  - Validate search input length and characters
  - Handle insufficient storage space for downloads
  - Handle network connectivity changes
  - Handle app backgrounding and foregrounding
  - Test edge cases thoroughly
  - _Requirements: 2.6, 2.7, 12.4, 12.6, 12.7_

## Integration Testing

- [ ] 46. Write end-to-end tests for complete user flows
  - Test complete search flow: launch → search → view results
  - Test complete download flow: select video → configure → download → verify file
  - Test background download: start download → close modal → verify continues
  - Test concurrent downloads: start multiple → verify all complete
  - Test error recovery: trigger error → retry → verify success
  - _Requirements: All requirements_

## Documentation and Final Polish

- [ ] 47. Add code documentation and comments
  - Document all public interfaces and functions
  - Add JSDoc comments for TypeScript types
  - Document complex logic and algorithms
  - Add README files for both mobile and backend projects
  - _Requirements: All requirements_

- [ ] 48. Create environment configuration files
  - Create .env.example for backend with required variables
  - Create .env.example for mobile app with API URL
  - Document all environment variables
  - Add configuration instructions to README
  - _Requirements: 10.3, 11.2_

- [ ] 49. Final testing and bug fixes
  - Run all unit tests and ensure they pass
  - Run all integration tests and ensure they pass
  - Test on both iOS and Android devices
  - Test in both dark and light modes
  - Fix any discovered bugs
  - _Requirements: All requirements_
