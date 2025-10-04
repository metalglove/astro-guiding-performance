/**
 * Physical and Mathematical Constants
 * 
 * This module contains fundamental constants used in astronomical calculations.
 * These values are derived from physics and astronomy standards.
 */

/**
 * Arc-second conversion factor used in astronomical calculations
 * 
 * This constant converts angular measurements in radians to arcseconds.
 * It's fundamental to the pixel scale calculation formula.
 * 
 * Value: 206,265 arcseconds per radian
 */
export const ARC_SECOND_CONVERSION_FACTOR = 206265;

/**
 * Millimeters per inch conversion factor
 * 
 * Used for converting telescope apertures from millimeters to inches
 * for Dawes limit calculations.
 */
export const MM_PER_INCH = 25.4;

/**
 * Dawes limit coefficient
 * 
 * Used in calculating theoretical telescope resolution.
 * Formula: Resolution (″) = DAWES_COEFFICIENT / Aperture (inches)
 */
export const DAWES_COEFFICIENT = 4.56;

/**
 * Nyquist sampling factor
 * 
 * For optimal sampling, pixel scale should be approximately
 * theoretical resolution divided by this factor.
 */
export const NYQUIST_FACTOR = 2.0;

/**
 * Quality threshold multipliers for guiding analysis
 * 
 * These define the multipliers applied to pixel scale to determine
 * quality thresholds for guiding performance.
 */
export const QUALITY_THRESHOLDS = {
  /** Perfect data threshold: 0.5 pixels */
  PERFECT: 0.5,
  /** Good data threshold: 1.0 pixels */
  GOOD: 1.0,
  /** Large error threshold: 3.0 pixels */
  LARGE_ERROR: 3.0,
  /** Jump detection threshold: 2.0 pixels */
  JUMP_DETECTION: 2.0
} as const;

/**
 * Guiding accuracy target multiplier
 * 
 * Rule of thumb: guiding accuracy should be approximately
 * pixel scale divided by this factor for sharp stars.
 */
export const GUIDING_ACCURACY_FACTOR = 3;

/**
 * Default SNR threshold for frame quality assessment
 */
export const DEFAULT_SNR_THRESHOLD = 10;
