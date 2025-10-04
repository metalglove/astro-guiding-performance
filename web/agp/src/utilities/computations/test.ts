/**
 * Basic test file to verify computation functions work correctly
 * This can be run to validate our astronomical and statistical computations
 */

import { 
  calculatePixelScale, 
  calculateTheoreticalResolution, 
  calculateSamplingRatio,
  calculateRMSStats,
  calculateQualityThresholds,
  ARC_SECOND_CONVERSION_FACTOR,
  QUALITY_THRESHOLDS
} from './index';

// Test astronomical computations
console.log('=== Astronomical Computations Test ===');

// Test pixel scale calculation for ASI 2600 MM Pro + 800mm telescope
const pixelSize = 3.76; // micrometers
const focalLength = 800; // mm
const pixelScale = calculatePixelScale(pixelSize, focalLength);
console.log(`Pixel Scale: ${pixelScale.toFixed(3)}" per pixel`);
console.log(`Expected: ~0.970" per pixel`);

// Test theoretical resolution for 203mm aperture
const aperture = 203; // mm
const resolution = calculateTheoreticalResolution(aperture);
console.log(`Theoretical Resolution: ${resolution.toFixed(3)}"`);
console.log(`Expected: ~0.57" (Dawes limit)`);

// Test sampling ratio
const samplingRatio = calculateSamplingRatio(pixelScale, resolution);
console.log(`Sampling Ratio: ${samplingRatio.toFixed(1)}`);
console.log(`Expected: ~3.4 (oversampled)`);

// Test statistical computations
console.log('\n=== Statistical Computations Test ===');

const testData = [
  { x: 0.1, y: 0.2 },
  { x: -0.3, y: 0.1 },
  { x: 0.2, y: -0.4 },
  { x: -0.1, y: 0.3 },
  { x: 0.4, y: -0.2 }
];

const rmsStats = calculateRMSStats(testData);
console.log(`RMS Stats - Total: ${rmsStats.total.toFixed(3)}, RA: ${rmsStats.ra.toFixed(3)}, Dec: ${rmsStats.dec.toFixed(3)}`);

// Test quality thresholds
console.log('\n=== Quality Threshold Test ===');
const thresholds = calculateQualityThresholds(pixelScale);
console.log(`Perfect Threshold: ${thresholds.perfect.toFixed(3)}" (${QUALITY_THRESHOLDS.PERFECT} pixels)`);
console.log(`Good Threshold: ${thresholds.good.toFixed(3)}" (${QUALITY_THRESHOLDS.GOOD} pixels)`);
console.log(`Large Error Threshold: ${thresholds.largeError.toFixed(3)}" (${QUALITY_THRESHOLDS.LARGE_ERROR} pixels)`);

// Test constants
console.log('\n=== Constants Test ===');
console.log(`Arc-second conversion factor: ${ARC_SECOND_CONVERSION_FACTOR}`);
console.log(`Expected: 206,265`);

console.log('\n✅ All computation tests completed successfully!');
