/**
 * Core astronomical computation functions
 * 
 * This module contains fundamental astronomical calculations used throughout the application.
 * These functions implement standard formulas from astrophotography and astronomical imaging.
 * 
 * References:
 * - CCD Equation: Standard astronomical formula for pixel scale
 * - Dawes Limit: Classical formula for telescope resolution
 * - Field of View: Standard calculation for imaging systems
 */

import { ARC_SECOND_CONVERSION_FACTOR } from '../constants';

/**
 * Calculate the pixel scale for a given camera and telescope combination
 * 
 * Formula: Pixel Scale (″/px) = (Pixel Size μm × 206,265) / Focal Length mm
 * 
 * @param pixelSizeUm - Camera pixel size in micrometers
 * @param focalLengthMm - Telescope focal length in millimeters
 * @param binning - Camera binning factor (default: 1)
 * @returns Pixel scale in arcseconds per pixel
 */
export function calculatePixelScale(
  pixelSizeUm: number, 
  focalLengthMm: number, 
  binning = 1
): number {
  const effectivePixelSize = pixelSizeUm * binning;
  return (effectivePixelSize * ARC_SECOND_CONVERSION_FACTOR) / focalLengthMm / 1000;
}

/**
 * Calculate theoretical telescope resolution using Dawes limit
 * 
 * Formula: Resolution (″) = 4.56 / Aperture (inches)
 * 
 * @param apertureMm - Telescope aperture in millimeters
 * @returns Theoretical resolution in arcseconds
 */
export function calculateTheoreticalResolution(apertureMm: number): number {
  const apertureInches = apertureMm / 25.4;
  return 4.56 / apertureInches;
}

/**
 * Calculate sampling ratio for optimal imaging
 * 
 * Optimal sampling occurs when pixel scale ≈ resolution/2 (Nyquist criterion)
 * 
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @param theoreticalResolution - Telescope resolution in arcseconds
 * @returns Sampling ratio (unitless)
 */
export function calculateSamplingRatio(
  pixelScale: number, 
  theoreticalResolution: number
): number {
  return pixelScale / (theoreticalResolution / 2);
}

/**
 * Calculate field of view for a camera and telescope combination
 * 
 * @param cameraDimensionPx - Camera dimension in pixels (width or height)
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Field of view in arcminutes
 */
export function calculateFieldOfView(
  cameraDimensionPx: number, 
  pixelScale: number
): number {
  return (cameraDimensionPx * pixelScale) / 60;
}

/**
 * Convert pixel coordinates to angular measurements
 * 
 * @param pixelError - Error in pixels
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Error in arcseconds
 */
export function pixelsToArcseconds(pixelError: number, pixelScale: number): number {
  return pixelError * pixelScale;
}

/**
 * Convert angular measurements to pixel coordinates
 * 
 * @param arcsecondsError - Error in arcseconds
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Error in pixels
 */
export function arcsecondsToPixels(arcsecondsError: number, pixelScale: number): number {
  return arcsecondsError / pixelScale;
}

/**
 * Calculate guiding accuracy target (rule of thumb: 1/3 of pixel scale)
 * 
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Target guiding accuracy in arcseconds
 */
export function calculateGuidingAccuracyTarget(pixelScale: number): number {
  return pixelScale / 3;
}
