/**
 * Polar Alignment Analysis Utilities
 * 
 * This module analyzes Dec drift patterns to estimate polar alignment error
 * and provides correction guidance for altitude and azimuth adjustments.
 * 
 * Theory:
 * - Altitude error causes Dec drift that varies with hour angle
 * - Azimuth error causes constant Dec drift regardless of hour angle
 * - By analyzing drift patterns east/west of meridian, we can decompose errors
 */

import { GuidingFrame } from '@/store/modules/PHD/PHD.types';

export interface PolarAlignmentError {
  altitudeError: number;    // arcminutes
  azimuthError: number;     // arcminutes
  totalError: number;       // arcminutes (vector magnitude)
  confidence: number;       // 0-1 (based on data quality)
  hemisphere: 'north' | 'south';
}

export interface PolarAlignmentCorrection {
  altitude: {
    direction: 'up' | 'down';
    magnitude: number;      // arcminutes
    description: string;
  };
  azimuth: {
    direction: 'left' | 'right';
    magnitude: number;      // arcminutes
    description: string;
  };
}

export interface PolarAlignmentAnalysis {
  error: PolarAlignmentError;
  corrections: PolarAlignmentCorrection;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  eastDriftRate: number;    // arcsec/min
  westDriftRate: number;    // arcsec/min
  recommendation: string;
}

export interface DriftPattern {
  hourAngle: number;        // hours
  decDrift: number;         // arcseconds per minute
  timestamp: Date;
}

/**
 * Calculate Dec drift rate for a set of frames
 */
function calculateDecDriftRate(frames: GuidingFrame[], pixelScale: number): number {
  if (frames.length < 2) return 0;

  // Calculate average Dec drift rate
  let totalDrift = 0;
  let count = 0;

  for (let i = 1; i < frames.length; i++) {
    const dt = (frames[i].datetime.getTime() - frames[i - 1].datetime.getTime()) / 1000; // seconds
    if (dt === 0) continue;

    const decDiff = (frames[i].dy - frames[i - 1].dy) * pixelScale; // arcseconds
    const driftRate = (decDiff / dt) * 60; // arcseconds per minute

    totalDrift += driftRate;
    count++;
  }

  return count > 0 ? totalDrift / count : 0;
}

/**
 * Analyze polar alignment based on Dec drift patterns
 * 
 * This function analyzes declination drift patterns to determine polar alignment error.
 * It separates frames by hour angle (east vs west of meridian) and calculates
 * altitude and azimuth errors based on drift differences.
 * 
 * @param frames - Array of guiding frames with RA/Dec/hour angle data
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @param latitude - Observer latitude in degrees (positive = north, negative = south)
 * @returns Polar alignment analysis results
 */
export function analyzePolarAlignment(
  frames: GuidingFrame[],
  pixelScale: number,
  latitude: number = 52.0 // Default to northern hemisphere
): PolarAlignmentAnalysis {
  // Determine hemisphere
  const hemisphere: 'north' | 'south' = latitude >= 0 ? 'north' : 'south';

  // Separate frames by hour angle (east vs west of meridian)
  const eastFrames = frames.filter(f => f.hourAngle < 0); // East of meridian
  const westFrames = frames.filter(f => f.hourAngle > 0); // West of meridian

  // Need data from both sides of meridian for accurate analysis
  const minFramesPerSide = 10;
  if (eastFrames.length < minFramesPerSide || westFrames.length < minFramesPerSide) {
    return {
      error: {
        altitudeError: 0,
        azimuthError: 0,
        totalError: 0,
        confidence: 0,
        hemisphere
      },
      corrections: {
        altitude: { direction: 'up', magnitude: 0, description: 'Insufficient data for analysis' },
        azimuth: { direction: 'left', magnitude: 0, description: 'Insufficient data for analysis' }
      },
      quality: 'poor',
      eastDriftRate: 0,
      westDriftRate: 0,
      recommendation: 'Need guiding data from both east and west of meridian for polar alignment analysis.'
    };
  }

  // Calculate Dec drift rates for each side
  const eastDrift = calculateDecDriftRate(eastFrames, pixelScale);
  const westDrift = calculateDecDriftRate(westFrames, pixelScale);

  // Decompose into altitude and azimuth errors
  // Altitude error: drift reverses across meridian
  // Formula: altitude_error = (eastDrift - westDrift) / 2
  const altitudeError = (eastDrift - westDrift) / 2; // arcsec/min

  // Azimuth error: constant drift both sides
  // Formula: azimuth_error = (eastDrift + westDrift) / 2
  const azimuthError = (eastDrift + westDrift) / 2; // arcsec/min

  // Convert to arcminutes (typical polar alignment unit)
  const altErrorArcmin = altitudeError;
  const azErrorArcmin = azimuthError;

  // Calculate total error magnitude
  const totalError = Math.sqrt(altErrorArcmin ** 2 + azErrorArcmin ** 2);

  // Calculate confidence based on data quality
  const minFrameCount = Math.min(eastFrames.length, westFrames.length);
  const confidence = Math.min(1.0, minFrameCount / 50); // Max confidence at 50+ frames per side

  // Determine correction directions
  const altitudeDirection: 'up' | 'down' = hemisphere === 'north'
    ? (altErrorArcmin > 0 ? 'down' : 'up')
    : (altErrorArcmin > 0 ? 'up' : 'down');

  const azimuthDirection: 'left' | 'right' = hemisphere === 'north'
    ? (azErrorArcmin > 0 ? 'right' : 'left')
    : (azErrorArcmin > 0 ? 'left' : 'right');

  // Generate correction descriptions
  const altitudeDescription = `Adjust altitude ${Math.abs(altErrorArcmin).toFixed(1)}' ${altitudeDirection}`;
  const azimuthDescription = `Adjust azimuth ${Math.abs(azErrorArcmin).toFixed(1)}' ${azimuthDirection}`;

  // Determine alignment quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (totalError < 1) quality = 'excellent';
  else if (totalError < 3) quality = 'good';
  else if (totalError < 5) quality = 'fair';
  else quality = 'poor';

  // Generate recommendation
  let recommendation: string;
  if (quality === 'excellent') {
    recommendation = 'Polar alignment is excellent! No adjustments needed.';
  } else if (quality === 'good') {
    recommendation = 'Polar alignment is good. Minor adjustments will improve performance.';
  } else if (quality === 'fair') {
    recommendation = 'Polar alignment needs improvement. Follow correction guidance below.';
  } else {
    recommendation = 'Polar alignment is poor. Significant corrections required for good guiding.';
  }

  return {
    error: {
      altitudeError: Math.abs(altErrorArcmin),
      azimuthError: Math.abs(azErrorArcmin),
      totalError,
      confidence,
      hemisphere
    },
    corrections: {
      altitude: {
        direction: altitudeDirection,
        magnitude: Math.abs(altErrorArcmin),
        description: altitudeDescription
      },
      azimuth: {
        direction: azimuthDirection,
        magnitude: Math.abs(azErrorArcmin),
        description: azimuthDescription
      }
    },
    quality,
    eastDriftRate: eastDrift,
    westDriftRate: westDrift,
    recommendation
  };
}

/**
 * Extract drift patterns from guiding frames
 * 
 * @param frames - Array of guiding frames
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Array of drift patterns with hour angle correlation
 */
export function extractDriftPatterns(
  frames: GuidingFrame[],
  pixelScale: number
): DriftPattern[] {
  const patterns: DriftPattern[] = [];

  for (let i = 1; i < frames.length; i++) {
    const dt = (frames[i].datetime.getTime() - frames[i - 1].datetime.getTime()) / 1000;
    if (dt === 0) continue;

    const decDiff = (frames[i].dy - frames[i - 1].dy) * pixelScale;
    const driftRate = (decDiff / dt) * 60; // arcsec/min

    patterns.push({
      hourAngle: frames[i].hourAngle,
      decDrift: driftRate,
      timestamp: frames[i].datetime
    });
  }

  return patterns;
}

/**
 * Calculate polar alignment quality rating
 * 
 * @param totalError - Total polar alignment error in arcminutes
 * @returns Quality rating from 0 (poor) to 100 (excellent)
 */
export function calculateAlignmentQuality(totalError: number): number {
  // Exponential decay function for quality score
  // Perfect alignment (0 error) = 100
  // 1 arcmin error = ~95
  // 3 arcmin error = ~80
  // 5 arcmin error = ~65
  // 10 arcmin error = ~35
  
  const quality = 100 * Math.exp(-totalError / 4);
  return Math.max(0, Math.min(100, quality));
}
