# Lottie Animations Usage Guide

## Overview

This app uses Lottie animations to enhance user experience with smooth, lightweight animations.

## Current Implementation

### 1. **Loading States**

- **Component**: `LottieAnimation` with type `'loading'`
- **Usage**: Search loading, general loading states
- **Location**: `src/components/LottieAnimation.tsx`

### 2. **Download Progress**

- **Component**: `LottieAnimation` with type `'downloading'`
- **Usage**: Active download indicator
- **Animation**: Animated download arrow

### 3. **Success States**

- **Component**: `LottieAnimation` with type `'success'`
- **Usage**: Download completion, successful actions
- **Animation**: Animated checkmark with scale effect

### 4. **Error States**

- **Component**: `LottieAnimation` with type `'error'`
- **Usage**: Failed downloads, error messages
- **Animation**: Animated X mark with rotation

### 5. **Empty States**

- **Component**: `LottieAnimation` with type `'empty'`
- **Usage**: No downloads, empty search results
- **Animation**: Floating empty box

### 6. **Search States**

- **Component**: `LottieAnimation` with type `'search'`
- **Usage**: Search in progress
- **Animation**: Animated magnifying glass

## Where to Use Lottie

### ✅ Currently Implemented

- Empty downloads screen
- Loading states (can be enhanced)

### 🎯 Recommended Additions

#### 1. **Download Progress Indicator**

Replace the circular progress with a Lottie animation:

```tsx
<LottieAnimation type="downloading" size={40} loop={true} />
```

#### 2. **Success Feedback**

Show animated success when download completes:

```tsx
<LottieAnimation
  type="success"
  size={60}
  loop={false}
  onAnimationFinish={() => hideNotification()}
/>
```

#### 3. **Error States**

Animate error messages:

```tsx
<LottieAnimation type="error" size={50} loop={false} />
```

#### 4. **Search Loading**

Replace search spinner:

```tsx
<LottieAnimation type="search" size={80} loop={true} />
```

#### 5. **Empty Search Results**

Show when no videos found:

```tsx
<LottieAnimation type="empty" size={150} loop={true} />
```

## Getting Better Animations

### Free Sources

1. **LottieFiles** - https://lottiefiles.com/

   - Search for: "download", "loading", "success", "error", "empty state"
   - Download JSON files
   - Place in `src/assets/animations/`

2. **Recommended Animations**:
   - Loading: https://lottiefiles.com/animations/loading
   - Download: https://lottiefiles.com/animations/download
   - Success: https://lottiefiles.com/animations/success
   - Error: https://lottiefiles.com/animations/error
   - Empty: https://lottiefiles.com/animations/empty

### Custom Animations

- Use Adobe After Effects with Bodymovin plugin
- Export as Lottie JSON
- Optimize with LottieFiles tools

## Performance Tips

1. **Keep animations small** (< 100KB)
2. **Use loop sparingly** for non-loading animations
3. **Preload animations** for instant playback
4. **Use colorFilters** to match theme colors dynamically

## Example Usage

```tsx
import LottieAnimation from '../components/LottieAnimation';

// In your component
<LottieAnimation
  type="loading"
  visible={isLoading}
  size={100}
  loop={true}
  autoPlay={true}
/>;
```

## Theme Integration

Animations automatically adapt to theme colors using `colorFilters`:

```tsx
colorFilters={[
  {
    keypath: '*',
    color: theme.colors.primary,
  },
]}
```

## Future Enhancements

1. Add pull-to-refresh animation
2. Add swipe gesture animations
3. Add tab switch animations
4. Add micro-interactions for buttons
5. Add skeleton loading screens with Lottie
