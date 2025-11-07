# Project Rules and Guidelines

This document outlines the project rules, guidelines, and architectural patterns for the YTDownloaderApp. Adhering to these guidelines ensures consistency, maintainability, and scalability of the application.

## 1. API Interaction

- All API interactions should be handled through `src/services/apiClient.ts`.
- Use `axios` for HTTP requests.
- Implement proper error handling for all API calls, including network errors, server responses, and data parsing issues.
- API endpoints should be defined as constants for easy management and updates.
- Sensitive information (API keys, tokens) should be stored securely and never hardcoded.

## 2. SSE Listeners

- Server-Sent Events (SSE) listeners should be managed through `react-native-sse`.
- Centralize SSE event handling in a dedicated service or hook (e.g., `src/services/sseService.ts` or `src/hooks/useSSE.ts`).
- Ensure proper connection management, including reconnection logic and error handling.
- Event types should be clearly defined and documented.

## 3. Configurations

- Application configurations (e.g., API base URLs, feature flags) should be managed in `src/config/env.ts`.
- Use environment variables for different build environments (development, staging, production).
- Avoid hardcoding configuration values directly in components or services.

## 4. Event Types

- Define custom event types in `src/types/index.ts` or a more specific `src/types/events.ts` if the number of events grows.
- Use clear and descriptive names for event types.
- Ensure consistency in event payload structures.

## 5. Custom Components

- All reusable UI components should be placed in `src/components/`.
- Each component should have its own directory containing the component file (`.tsx`), its styles file (`.styles.ts`), and potentially an `index.ts` for easier imports.
- Components should be functional components using React Hooks.
- Prioritize composition over inheritance.
- Use `React.memo` for performance optimization where appropriate.
- Styles for custom components should be defined in separate `.styles.ts` files, using `StyleSheet.create` or `useMemo` with theme context for dynamic styling.
- Responsive design should be implemented using utilities from `src/utils/responsive.ts`.

## 6. Project Requirements

- **Cross-Platform Compatibility**: The application must function correctly on both Android and iOS platforms.
- **Performance**: Optimize for smooth animations, fast loading times, and efficient resource usage.
- **User Experience (UX)**: Intuitive navigation, clear feedback, and accessible design.
- **Error Handling**: Robust error handling and user-friendly error messages.
- **Security**: Protect user data and ensure secure communication.
- **Maintainability**: Write clean, well-documented, and modular code.

## 7. Coding Software Pattern

- **Architecture**: Follow a clear, scalable architecture (e.g., MVVM, Clean Architecture principles).
- **State Management**: Use React Context API or a lightweight state management library for global state.
- **Styling**: Use `StyleSheet.create` with theme context for consistent and maintainable styling. Externalize styles into `.styles.ts` files.
- **Hooks**: Leverage custom hooks (`src/hooks/`) for encapsulating reusable logic.
- **Services**: Separate business logic and data fetching into dedicated services (`src/services/`).
- **Typescript**: Strictly use TypeScript for type safety and improved developer experience.
- **Code Formatting**: Adhere to Prettier and ESLint rules for consistent code formatting and quality.
- **Testing**: Implement unit and integration tests for critical components and functionalities.

## 8. Event Handling and Download Architecture

### Event Types and Actions:

- **`DOWNLOAD_QUEUED`**: Triggered when a new download request is added to the queue.
  - **Action**: Adds the video metadata to the download queue, updates UI to reflect pending status.
- **`DOWNLOAD_STARTED`**: Fired when a download begins processing from the queue.
  - **Action**: Initiates the actual download process, updates UI to show active download.
- **`DOWNLOAD_PROGRESS`**: Emitted periodically during an active download.
  - **Action**: Updates the download progress bar and displays current speed/remaining time.
- **`DOWNLOAD_COMPLETED`**: Signifies a successful download.
  - **Action**: Moves the downloaded file to its final location, updates UI to show completion, removes from active downloads.
- **`DOWNLOAD_FAILED`**: Indicates an error during download.
  - **Action**: Logs the error, displays an error message to the user, potentially retries or moves to a failed state.
- **`DOWNLOAD_CANCELLED`**: Triggered when a user cancels a download.
  - **Action**: Stops the ongoing download, removes temporary files, updates UI.

### Use of Queues:

- **Download Queue**: Manages pending video downloads. New download requests are added to this queue.
  - **Implementation**: Likely a FIFO (First-In, First-Out) queue to process downloads in the order they were requested.
  - **Purpose**: Prevents overwhelming the system with too many concurrent downloads, ensures orderly processing.

### Download Architecture:

- **Service-Oriented**: A dedicated `downloadService` (e.g., `src/services/downloadService.ts`) handles all download-related logic.
- **Background Processing**: Downloads should ideally run in the background, even if the app is closed or in the background, using native modules or background task APIs.
- **State Management**: Download progress and status are managed globally (e.g., via `useDownloads` hook or Context API) to ensure UI consistency across components.
- **File System Interaction**: Utilizes `react-native-fs` or `react-native-blob-util` for robust file operations (saving, moving, deleting).
- **Error Recovery**: Implements retry mechanisms for transient network errors.

### Object Types:

- **`Video`**: Represents a video entity with properties like `id`, `title`, `thumbnailUrl`, `channelName`, `duration`, `formats` (array of `VideoFormat`).
- **`VideoFormat`**: Describes available formats for a video, including `quality`, `extension`, `url`, `bitrate` (for audio).
- **`DownloadItem`**: Represents an item in the download queue or a completed download, including `videoId`, `format`, `quality`, `progress`, `status` (pending, in_progress, completed, failed, cancelled), `filePath`.
- **`Theme`**: An object defining color palettes, spacing, and typography for consistent UI styling.
