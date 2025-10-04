/**
 * Quality analysis computations for guiding and imaging data
 * 
 * This module contains functions for analyzing guiding quality based on
 * established thresholds and best practices in astrophotography.
 */

import { QUALITY_THRESHOLDS, DEFAULT_SNR_THRESHOLD } from '../constants/physics';
import { DataPoint } from './statistics';

export interface QualityThresholds {
  perfect: number;
  good: number;
  largeError: number;
  jumpDetection: number;
}

export interface FrameQuality {
  isPerfect: boolean;
  isGood: boolean;
  hasLargeError: boolean;
  hasJump: boolean;
  hasLowSNR: boolean;
  totalError: number;
}

/**
 * Calculate quality thresholds based on pixel scale
 * 
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Quality thresholds in arcseconds
 */
export function calculateQualityThresholds(pixelScale: number): QualityThresholds {
  return {
    perfect: QUALITY_THRESHOLDS.PERFECT * pixelScale,
    good: QUALITY_THRESHOLDS.GOOD * pixelScale,
    largeError: QUALITY_THRESHOLDS.LARGE_ERROR * pixelScale,
    jumpDetection: QUALITY_THRESHOLDS.JUMP_DETECTION * pixelScale
  };
}

/**
 * Analyze frame quality based on guiding error and SNR
 * 
 * @param dx - X-axis guiding error in pixels or arcseconds
 * @param dy - Y-axis guiding error in pixels or arcseconds
 * @param snr - Signal-to-noise ratio
 * @param thresholds - Quality thresholds to apply
 * @param previousFrame - Previous frame for jump detection (optional)
 * @returns Frame quality analysis
 */
export function analyzeFrameQuality(
  dx: number,
  dy: number,
  snr: number,
  thresholds: QualityThresholds,
  previousFrame?: { dx: number; dy: number }
): FrameQuality {
  const totalError = Math.sqrt(dx * dx + dy * dy);
  
  let hasJump = false;
  if (previousFrame) {
    const jumpMagnitude = Math.sqrt(
      Math.pow(dx - previousFrame.dx, 2) + Math.pow(dy - previousFrame.dy, 2)
    );
    hasJump = jumpMagnitude > thresholds.jumpDetection;
  }

  return {
    isPerfect: totalError <= thresholds.perfect,
    isGood: totalError <= thresholds.good,
    hasLargeError: totalError > thresholds.largeError,
    hasJump,
    hasLowSNR: snr < DEFAULT_SNR_THRESHOLD,
    totalError
  };
}

/**
 * Calculate percentage of frames meeting quality criteria
 * 
 * @param data - Array of data points
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Quality percentages
 */
export function calculateQualityPercentages(
  data: DataPoint[],
  pixelScale: number
): {
  perfectPercentage: number;
  goodPercentage: number;
} {
  if (!data || data.length === 0) {
    return { perfectPercentage: 0, goodPercentage: 0 };
  }

  const thresholds = calculateQualityThresholds(pixelScale);
  
  const perfectCount = data.filter(point => {
    const totalError = point.totalXY ?? Math.sqrt(point.x * point.x + point.y * point.y);
    return totalError <= thresholds.perfect;
  }).length;

  const goodCount = data.filter(point => {
    const totalError = point.totalXY ?? Math.sqrt(point.x * point.x + point.y * point.y);
    return totalError <= thresholds.good;
  }).length;

  return {
    perfectPercentage: (perfectCount / data.length) * 100,
    goodPercentage: (goodCount / data.length) * 100
  };
}

/**
 * Determine guiding quality assessment based on statistics
 * 
 * @param rmsTotal - Total RMS error in arcseconds
 * @param perfectPercentage - Percentage of perfect data points
 * @param goodPercentage - Percentage of good data points
 * @returns Quality assessment string
 */
export function assessGuidingQuality(
  rmsTotal: number,
  perfectPercentage: number,
  goodPercentage: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rmsTotal <= 0.5 && perfectPercentage >= 80) {
    return 'excellent';
  } else if (rmsTotal <= 1.0 && goodPercentage >= 70) {
    return 'good';
  } else if (rmsTotal <= 2.0 && goodPercentage >= 50) {
    return 'fair';
  } else {
    return 'poor';
  }
}

/**
 * Calculate improvement potential if problematic frames were removed
 * 
 * @param data - Original dataset
 * @param thresholds - Quality thresholds
 * @returns Potential improvement statistics
 */
export function calculateImprovementPotential(
  data: DataPoint[],
  thresholds: QualityThresholds
): {
  originalRMS: number;
  improvedRMS: number;
  framesRemoved: number;
  improvementPercent: number;
} {
  if (!data || data.length === 0) {
    return { originalRMS: 0, improvedRMS: 0, framesRemoved: 0, improvementPercent: 0 };
  }

  // Calculate original RMS
  const originalValues = data.map(d => d.totalXY ?? Math.sqrt(d.x * d.x + d.y * d.y));
  const originalRMS = Math.sqrt(originalValues.reduce((sum, val) => sum + val * val, 0) / originalValues.length);

  // Filter out problematic frames
  const filteredData = data.filter(point => {
    const totalError = point.totalXY ?? Math.sqrt(point.x * point.x + point.y * point.y);
    return totalError <= thresholds.largeError;
  });

  if (filteredData.length === 0) {
    return { originalRMS, improvedRMS: originalRMS, framesRemoved: 0, improvementPercent: 0 };
  }

  // Calculate improved RMS
  const improvedValues = filteredData.map(d => d.totalXY ?? Math.sqrt(d.x * d.x + d.y * d.y));
  const improvedRMS = Math.sqrt(improvedValues.reduce((sum, val) => sum + val * val, 0) / improvedValues.length);

  const framesRemoved = data.length - filteredData.length;
  const improvementPercent = ((originalRMS - improvedRMS) / originalRMS) * 100;

  return {
    originalRMS,
    improvedRMS,
    framesRemoved,
    improvementPercent: Math.max(0, improvementPercent)
  };
}
