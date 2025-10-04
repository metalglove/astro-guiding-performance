/**
 * Statistical computation functions for guiding analysis
 * 
 * This module contains statistical functions used for analyzing guiding performance.
 * These implement standard statistical methods for time-series analysis.
 */

export interface RMSStats {
  total: number;
  ra: number;
  dec: number;
}

export interface DataPoint {
  x: number;
  y: number;
  totalXY?: number;
}

/**
 * Calculate Root Mean Square (RMS) error for guiding data
 * 
 * Formula: RMS = √(Σ(error²) / n)
 * 
 * @param data - Array of data points with x, y coordinates
 * @returns RMS statistics for RA, Dec, and total error
 */
export function calculateRMSStats(data: DataPoint[]): RMSStats {
  if (!data || data.length === 0) {
    return { total: 0, ra: 0, dec: 0 };
  }

  const raValues = data.map(d => d.x);
  const decValues = data.map(d => d.y);
  const totalValues = data.map(d => d.totalXY ?? Math.sqrt(d.x * d.x + d.y * d.y));

  const raRms = Math.sqrt(raValues.reduce((sum, val) => sum + val * val, 0) / raValues.length);
  const decRms = Math.sqrt(decValues.reduce((sum, val) => sum + val * val, 0) / decValues.length);
  const totalRms = Math.sqrt(totalValues.reduce((sum, val) => sum + val * val, 0) / totalValues.length);

  return {
    total: totalRms,
    ra: raRms,
    dec: decRms
  };
}

/**
 * Calculate the percentage of data points within a threshold
 * 
 * @param data - Array of data points
 * @param threshold - Threshold value for comparison
 * @returns Percentage of points within threshold (0-100)
 */
export function calculatePercentageWithinThreshold(
  data: DataPoint[], 
  threshold: number
): number {
  if (!data || data.length === 0) return 0;

  const pointsWithinThreshold = data.filter(point => {
    const totalError = point.totalXY ?? Math.sqrt(point.x * point.x + point.y * point.y);
    return totalError <= threshold;
  }).length;

  return (pointsWithinThreshold / data.length) * 100;
}

/**
 * Calculate maximum error in dataset
 * 
 * @param data - Array of data points
 * @returns Maximum total error value
 */
export function calculateMaxError(data: DataPoint[]): number {
  if (!data || data.length === 0) return 0;

  return Math.max(...data.map(d => d.totalXY ?? Math.sqrt(d.x * d.x + d.y * d.y)));
}

/**
 * Calculate session duration from timestamp data
 * 
 * @param timestamps - Array of Date objects
 * @returns Duration in seconds
 */
export function calculateSessionDuration(timestamps: Date[]): number {
  if (!timestamps || timestamps.length < 2) return 0;

  const startTime = new Date(timestamps[0]).getTime();
  const endTime = new Date(timestamps[timestamps.length - 1]).getTime();

  return (endTime - startTime) / 1000; // Convert to seconds
}

/**
 * Calculate percentiles for a dataset
 * 
 * @param values - Array of numeric values
 * @param percentiles - Array of percentile values to calculate (0-100)
 * @returns Object mapping percentile to value
 */
export function calculatePercentiles(
  values: number[], 
  percentiles: number[]
): Record<number, number> {
  if (!values || values.length === 0) {
    return percentiles.reduce((acc, p) => ({ ...acc, [p]: 0 }), {});
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const result: Record<number, number> = {};

  percentiles.forEach(percentile => {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      result[percentile] = sortedValues[lower];
    } else {
      result[percentile] = sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
  });

  return result;
}

/**
 * Sample data for performance optimization
 * 
 * @param data - Original dataset
 * @param maxPoints - Maximum number of points to return
 * @returns Sampled dataset
 */
export function sampleData<T>(data: T[], maxPoints: number): T[] {
  if (!data || data.length <= maxPoints) return data;

  const step = data.length / maxPoints;
  const sampled: T[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[Math.floor(i)]);
  }

  return sampled;
}
