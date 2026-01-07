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

// Drift analysis computations
export {
  analyzeDrift,
  calculateDriftRate,
  detectBacklashEvents,
  compareMultipleSessions,
  generateMultiSessionOverlay,
  analyzePeriodicError,
  generatePECTable,
  estimateWormPeriod
} from './drift';

export type { DriftAnalysis, DriftVector, BacklashEvent, PeriodicErrorAnalysis } from './drift';

// Polar alignment analysis computations
export {
  analyzePolarAlignment,
  extractDriftPatterns,
  calculateAlignmentQuality
} from './polarAlignment';

export type { 
  PolarAlignmentError,
  PolarAlignmentCorrection,
  PolarAlignmentAnalysis,
  DriftPattern
} from './polarAlignment';
