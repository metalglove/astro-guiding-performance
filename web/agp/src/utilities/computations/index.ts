/**
 * Computation utilities index
 * 
 * This module exports all computation functions for easy importing
 * throughout the application.
 */

// Astronomical computations
export {
  calculatePixelScale,
  calculateTheoreticalResolution,
  calculateSamplingRatio,
  calculateFieldOfView,
  pixelsToArcseconds,
  arcsecondsToPixels,
  calculateGuidingAccuracyTarget
} from './astronomical';

// Statistical computations
export {
  calculateRMSStats,
  calculatePercentageWithinThreshold,
  calculateMaxError,
  calculateSessionDuration,
  calculatePercentiles,
  sampleData
} from './statistics';

export type { RMSStats, DataPoint } from './statistics';

// Quality analysis computations
export {
  calculateQualityThresholds,
  analyzeFrameQuality,
  calculateQualityPercentages,
  assessGuidingQuality,
  calculateImprovementPotential
} from './quality';

export type { QualityThresholds, FrameQuality } from './quality';

// Constants
export * from '../constants/physics';
