import { Dimensions } from 'react-native';

/**
 * Utility helpers for creating responsive sizes across different screen dimensions.
 *
 * The helpers are inspired by react-native-size-matters but re-implemented to
 * avoid external dependencies. They rely on a set of guideline dimensions
 * (based on iPhone 11 Pro – 375 x 812) and scale values proportionally.
 *
 * Usage:
 *   import { scale, verticalScale, moderateScale } from '../utils/responsive';
 *   const styles = StyleSheet.create({
 *     container: {
 *       paddingHorizontal: scale(16),
 *       paddingVertical: verticalScale(12),
 *     },
 *     title: {
 *       fontSize: moderateScale(18),
 *     },
 *   });
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone 11 Pro's scale
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Scales size horizontally based on screen width
 */
export const scale = (size: number) =>
  (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Scales size vertically based on screen height
 */
export const verticalScale = (size: number) =>
  (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Scales size with a moderator so that the final size is a blend between the
 * original size and the scaled size. The default factor of 0.5 yields a gentle
 * scaling that works well on phones and tablets.
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
