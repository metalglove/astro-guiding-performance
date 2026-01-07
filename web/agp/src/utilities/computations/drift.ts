/**
 * Drift analysis computations for telescope guiding data
 * 
 * This module contains functions for analyzing drift patterns in guiding data,
 * including drift rate calculations, directional analysis, and environmental correlations.
 */

import { GuidingFrame } from '@/store/modules/PHD/PHD.types';
import { calculateQualityPercentages } from './quality';
import type { DataPoint } from './statistics';
import { AutoFocusEvent } from '@/store/modules/ASIAIR/ASIAIR.types';

export interface DriftVector {
  timestamp: Date;
  driftRate: number; // arcseconds per minute
  direction: number; // degrees (0 = North, 90 = East, etc.)
  raDrift: number;   // RA component in arcseconds per minute
  decDrift: number;  // Dec component in arcseconds per minute
}

export interface DriftAnalysis {
  driftVectors: DriftVector[];
  averageDriftRate: number;
  maxDriftRate: number;
  dominantDirection: number;
  driftStability: number; // coefficient of variation (lower = more stable)
  temperatureCorrelation?: number; // correlation coefficient (-1 to 1)
}

export interface BacklashEvent {
  timestamp: Date;
  directionChange: 'CW' | 'CCW' | 'RA' | 'Dec';
  magnitude: number; // arcseconds
  recoveryTime: number; // seconds
}

export interface PeriodicErrorAnalysis {
  frequency: number; // Hz (worm gear rotation frequency)
  amplitude: number; // arcseconds peak-to-peak
  phase: number; // radians
  confidence: number; // 0-1
}

/**
 * Calculate drift rate from a pair of guiding frames
 * 
 * @param frame1 - First guiding frame
 * @param frame2 - Second guiding frame  
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Drift vector between the two frames
 */
export function calculateDriftRate(
  frame1: GuidingFrame,
  frame2: GuidingFrame,
  pixelScale: number
): DriftVector | null {
  const timeDiffMs = frame2.timeInMilliseconds - frame1.timeInMilliseconds;
  
  if (timeDiffMs <= 0) return null;
  
  const timeDiffMinutes = timeDiffMs / (1000 * 60);
  
  // Convert pixel errors to arcseconds
  const raError1 = frame1.dx * pixelScale;
  const decError1 = frame1.dy * pixelScale;
  const raError2 = frame2.dx * pixelScale;
  const decError2 = frame2.dy * pixelScale;
  
  // Calculate drift rates (arcseconds per minute)
  const raDrift = (raError2 - raError1) / timeDiffMinutes;
  const decDrift = (decError2 - decError1) / timeDiffMinutes;
  
  const driftRate = Math.sqrt(raDrift * raDrift + decDrift * decDrift);
  const direction = Math.atan2(raDrift, decDrift) * (180 / Math.PI); // Convert to degrees
  
  return {
    timestamp: new Date(frame2.datetime),
    driftRate,
    direction: direction < 0 ? direction + 360 : direction,
    raDrift,
    decDrift
  };
}

/**
 * Analyze drift patterns across a guiding session
 * 
 * @param frames - Array of guiding frames
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @param autofocusEvents - Optional autofocus events for temperature correlation
 * @returns Comprehensive drift analysis
 */
export function analyzeDrift(
  frames: GuidingFrame[],
  pixelScale: number,
  autofocusEvents?: AutoFocusEvent[]
): DriftAnalysis {
  if (frames.length < 2) {
    return {
      driftVectors: [],
      averageDriftRate: 0,
      maxDriftRate: 0,
      dominantDirection: 0,
      driftStability: 0
    };
  }
  
  // Calculate drift vectors between consecutive frames
  const driftVectors: DriftVector[] = [];
  
  for (let i = 1; i < frames.length; i++) {
    const driftVector = calculateDriftRate(frames[i-1], frames[i], pixelScale);
    if (driftVector) {
      driftVectors.push(driftVector);
    }
  }
  
  if (driftVectors.length === 0) {
    return {
      driftVectors: [],
      averageDriftRate: 0,
      maxDriftRate: 0,
      dominantDirection: 0,
      driftStability: 0
    };
  }
  
  // Calculate statistics
  const driftRates = driftVectors.map(v => v.driftRate);
  const averageDriftRate = driftRates.reduce((sum, rate) => sum + rate, 0) / driftRates.length;
  const maxDriftRate = Math.max(...driftRates);
  
  // Calculate dominant direction (weighted by magnitude)
  let totalWeight = 0;
  let weightedSin = 0;
  let weightedCos = 0;
  
  driftVectors.forEach(vector => {
    const weight = vector.driftRate;
    const radians = vector.direction * (Math.PI / 180);
    weightedSin += Math.sin(radians) * weight;
    weightedCos += Math.cos(radians) * weight;
    totalWeight += weight;
  });
  
  const dominantDirection = Math.atan2(weightedSin / totalWeight, weightedCos / totalWeight) * (180 / Math.PI);
  
  // Calculate stability (coefficient of variation)
  const variance = driftRates.reduce((sum, rate) => sum + Math.pow(rate - averageDriftRate, 2), 0) / driftRates.length;
  const stdDev = Math.sqrt(variance);
  const driftStability = stdDev / averageDriftRate; // coefficient of variation
  
  const result: DriftAnalysis = {
    driftVectors,
    averageDriftRate,
    maxDriftRate,
    dominantDirection: dominantDirection < 0 ? dominantDirection + 360 : dominantDirection,
    driftStability
  };
  
  // Add temperature correlation if autofocus data available
  if (autofocusEvents && autofocusEvents.length > 0) {
    result.temperatureCorrelation = calculateTemperatureDriftCorrelation(driftVectors, autofocusEvents);
  }
  
  return result;
}

/**
 * Calculate correlation between drift rate and temperature
 * 
 * @param driftVectors - Array of drift vectors
 * @param autofocusEvents - Array of autofocus events with temperature data
 * @returns Correlation coefficient (-1 to 1)
 */
function calculateTemperatureDriftCorrelation(
  driftVectors: DriftVector[],
  autofocusEvents: AutoFocusEvent[]
): number {
  if (driftVectors.length < 2 || autofocusEvents.length < 2) {
    return 0;
  }
  
  // Interpolate temperatures at drift vector timestamps
  const correlatedData: { driftRate: number; temperature: number }[] = [];
  
  driftVectors.forEach(vector => {
    const interpolatedTemp = interpolateTemperature(vector.timestamp, autofocusEvents);
    if (interpolatedTemp !== null) {
      correlatedData.push({
        driftRate: vector.driftRate,
        temperature: interpolatedTemp
      });
    }
  });
  
  if (correlatedData.length < 2) {
    return 0;
  }
  
  // Calculate Pearson correlation coefficient
  const n = correlatedData.length;
  const sumDrift = correlatedData.reduce((sum, d) => sum + d.driftRate, 0);
  const sumTemp = correlatedData.reduce((sum, d) => sum + d.temperature, 0);
  const sumDriftTemp = correlatedData.reduce((sum, d) => sum + d.driftRate * d.temperature, 0);
  const sumDriftSq = correlatedData.reduce((sum, d) => sum + d.driftRate * d.driftRate, 0);
  const sumTempSq = correlatedData.reduce((sum, d) => sum + d.temperature * d.temperature, 0);
  
  const numerator = n * sumDriftTemp - sumDrift * sumTemp;
  const denominator = Math.sqrt((n * sumDriftSq - sumDrift * sumDrift) * (n * sumTempSq - sumTemp * sumTemp));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Interpolate temperature at a specific timestamp
 * 
 * @param timestamp - Target timestamp
 * @param autofocusEvents - Array of autofocus events
 * @returns Interpolated temperature or null if out of range
 */
function interpolateTemperature(timestamp: Date, autofocusEvents: AutoFocusEvent[]): number | null {
  const targetTime = timestamp.getTime();
  
  // Find events before and after target time
  const before = autofocusEvents
    .filter(event => event.startTime.getTime() <= targetTime)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
    
  const after = autofocusEvents
    .filter(event => event.startTime.getTime() >= targetTime)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  
  if (!before && !after) return null;
  if (!before) return after.temperature;
  if (!after) return before.temperature;
  
  // Linear interpolation
  const time1 = before.startTime.getTime();
  const time2 = after.startTime.getTime();
  const temp1 = before.temperature;
  const temp2 = after.temperature;
  
  const ratio = (targetTime - time1) / (time2 - time1);
  return temp1 + (temp2 - temp1) * ratio;
}

/**
 * Detect backlash events in guiding data
 * 
 * @param frames - Array of guiding frames
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @param threshold - Minimum magnitude to consider as backlash (arcseconds)
 * @returns Array of detected backlash events
 */
export function detectBacklashEvents(
  frames: GuidingFrame[],
  pixelScale: number,
  threshold: number = 2.0
): BacklashEvent[] {
  const events: BacklashEvent[] = [];
  
  for (let i = 2; i < frames.length; i++) {
    const prevPrev = frames[i-2];
    const prev = frames[i-1];
    const current = frames[i];
    
    // Check for direction changes in RA and Dec corrections
    const raDirectionChange = Math.sign(prev.RADuration - prevPrev.RADuration) !== Math.sign(current.RADuration - prev.RADuration);
    const decDirectionChange = Math.sign(prev.DECDuration - prevPrev.DECDuration) !== Math.sign(current.DECDuration - prev.DECDuration);
    
    if (raDirectionChange || decDirectionChange) {
      // Calculate position jump magnitude
      const prevError = Math.sqrt(prev.dx * prev.dx + prev.dy * prev.dy) * pixelScale;
      const currentError = Math.sqrt(current.dx * current.dx + current.dy * current.dy) * pixelScale;
      const magnitude = Math.abs(currentError - prevError);
      
      if (magnitude >= threshold) {
        // Estimate recovery time (frames until error stabilizes)
        let recoveryTime = 0;
        for (let j = i + 1; j < Math.min(i + 10, frames.length); j++) {
          const error = Math.sqrt(frames[j].dx * frames[j].dx + frames[j].dy * frames[j].dy) * pixelScale;
          if (Math.abs(error - prevError) < threshold / 2) {
            recoveryTime = (frames[j].timeInMilliseconds - current.timeInMilliseconds) / 1000;
            break;
          }
        }
        
        events.push({
          timestamp: new Date(current.datetime),
          directionChange: raDirectionChange ? 'RA' : 'Dec',
          magnitude,
          recoveryTime
        });
      }
    }
  }
  
  return events;
}

/**
 * Detect periodic error patterns using FFT analysis
 * 
 * @param frames - Array of guiding frames
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns Periodic error analysis results
 */
export function analyzePeriodicError(
  frames: GuidingFrame[],
  pixelScale: number
): PeriodicErrorAnalysis {
  if (frames.length < 32) { // Need minimum samples for meaningful FFT
    return {
      frequency: 0,
      amplitude: 0,
      phase: 0,
      confidence: 0
    };
  }

  // Extract RA errors over time
  const raErrors: number[] = [];
  const timeStamps: number[] = [];

  frames.forEach(frame => {
    raErrors.push(frame.dx * pixelScale); // Convert to arcseconds
    timeStamps.push(frame.timeInMilliseconds);
  });

  // Resample to evenly spaced time intervals (interpolate if needed)
  const resampledErrors = resampleForFFT(raErrors, timeStamps);

  // Apply FFT
  const fftResult = performFFT(resampledErrors);

  // Find dominant frequency (should be worm gear period)
  const dominantFreq = findDominantFrequency(fftResult, timeStamps);

  // Calculate amplitude and phase
  const amplitude = calculateAmplitude(fftResult, dominantFreq.index);
  const phase = calculatePhase(fftResult, dominantFreq.index);

  // Calculate confidence based on signal-to-noise ratio
  const confidence = calculateFFTConfidence(fftResult, dominantFreq.index);

  return {
    frequency: dominantFreq.frequency,
    amplitude,
    phase,
    confidence
  };
}

/**
 * Resample data to evenly spaced time intervals for FFT
 * 
 * @param errors - RA error values
 * @param timestamps - Corresponding timestamps
 * @param targetInterval - Target time interval in milliseconds (default: 1000ms)
 * @returns Resampled error values
 */
function resampleForFFT(
  errors: number[],
  timestamps: number[],
  targetInterval: number = 1000
): number[] {
  if (errors.length < 2) return errors;

  const startTime = timestamps[0];
  const endTime = timestamps[timestamps.length - 1];
  const duration = endTime - startTime;

  // Calculate number of samples needed
  const numSamples = Math.floor(duration / targetInterval) + 1;
  const resampled: number[] = new Array(numSamples);

  // Simple linear interpolation
  for (let i = 0; i < numSamples; i++) {
    const targetTime = startTime + i * targetInterval;

    // Find bracketing points
    let leftIndex = 0;
    let rightIndex = timestamps.length - 1;

    for (let j = 0; j < timestamps.length - 1; j++) {
      if (timestamps[j] <= targetTime && timestamps[j + 1] >= targetTime) {
        leftIndex = j;
        rightIndex = j + 1;
        break;
      }
    }

    // Linear interpolation
    const t1 = timestamps[leftIndex];
    const t2 = timestamps[rightIndex];
    const v1 = errors[leftIndex];
    const v2 = errors[rightIndex];

    if (t2 === t1) {
      resampled[i] = v1;
    } else {
      const ratio = (targetTime - t1) / (t2 - t1);
      resampled[i] = v1 + (v2 - v1) * ratio;
    }
  }

  return resampled;
}

/**
 * Perform FFT analysis on the resampled data
 * 
 * @param data - Evenly spaced data points
 * @returns FFT result with real and imaginary components
 */
function performFFT(data: number[]): { real: number[]; imag: number[] } {
  // Pad to next power of 2 for efficient FFT
  const paddedLength = Math.pow(2, Math.ceil(Math.log2(data.length)));
  const paddedData = new Array(paddedLength).fill(0);
  data.forEach((val, i) => paddedData[i] = val);

  // Simple DFT implementation (could be optimized with FFT.js for large datasets)
  const real: number[] = new Array(paddedLength / 2);
  const imag: number[] = new Array(paddedLength / 2);

  const N = paddedLength;
  for (let k = 0; k < N / 2; k++) {
    let realSum = 0;
    let imagSum = 0;

    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      realSum += paddedData[n] * Math.cos(angle);
      imagSum += paddedData[n] * Math.sin(angle);
    }

    real[k] = realSum;
    imag[k] = imagSum;
  }

  return { real, imag };
}

/**
 * Find the dominant frequency in the FFT result
 * 
 * @param fftResult - FFT result with real and imaginary components
 * @param timestamps - Original timestamps for frequency calculation
 * @returns Dominant frequency information
 */
function findDominantFrequency(
  fftResult: { real: number[]; imag: number[] },
  timestamps: number[]
): { frequency: number; index: number; magnitude: number } {
  const magnitudes = fftResult.real.map((real, i) =>
    Math.sqrt(real * real + fftResult.imag[i] * fftResult.imag[i])
  );

  // Skip DC component (index 0)
  let maxMagnitude = 0;
  let maxIndex = 1;

  for (let i = 1; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxMagnitude) {
      maxMagnitude = magnitudes[i];
      maxIndex = i;
    }
  }

  // Calculate frequency in Hz
  const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000; // seconds
  const frequency = maxIndex / duration; // Hz

  return {
    frequency,
    index: maxIndex,
    magnitude: maxMagnitude
  };
}

/**
 * Calculate amplitude of periodic error at given frequency
 * 
 * @param fftResult - FFT result
 * @param frequencyIndex - Index of the frequency in FFT result
 * @returns Amplitude in arcseconds
 */
function calculateAmplitude(
  fftResult: { real: number[]; imag: number[] },
  frequencyIndex: number
): number {
  const real = fftResult.real[frequencyIndex];
  const imag = fftResult.imag[frequencyIndex];
  const magnitude = Math.sqrt(real * real + imag * imag);

  // Convert to amplitude (magnitude / N * 2 for single-sided FFT)
  return (magnitude / fftResult.real.length) * 2;
}

/**
 * Calculate phase of periodic error
 * 
 * @param fftResult - FFT result
 * @param frequencyIndex - Index of the frequency in FFT result
 * @returns Phase in radians
 */
function calculatePhase(
  fftResult: { real: number[]; imag: number[] },
  frequencyIndex: number
): number {
  const real = fftResult.real[frequencyIndex];
  const imag = fftResult.imag[frequencyIndex];

  return Math.atan2(imag, real);
}

/**
 * Calculate confidence in periodic error detection
 * 
 * @param fftResult - FFT result
 * @param dominantIndex - Index of dominant frequency
 * @returns Confidence score (0-1)
 */
function calculateFFTConfidence(
  fftResult: { real: number[]; imag: number[] },
  dominantIndex: number
): number {
  const magnitudes = fftResult.real.map((real, i) =>
    Math.sqrt(real * real + fftResult.imag[i] * fftResult.imag[i])
  );

  const dominantMagnitude = magnitudes[dominantIndex];
  const totalMagnitude = magnitudes.reduce((sum, mag) => sum + mag * mag, 0);
  const averageMagnitude = Math.sqrt(totalMagnitude / magnitudes.length);

  // Signal-to-noise ratio based confidence
  const snr = dominantMagnitude / averageMagnitude;

  // Convert to 0-1 confidence score
  return Math.min(1, Math.max(0, (snr - 1) / 9)); // SNR of 1 = 0 confidence, SNR of 10 = 1 confidence
}

/**
 * Generate PEC (Periodic Error Correction) training curve
 * 
 * @param periodicError - Periodic error analysis result
 * @param numPoints - Number of points in the correction curve
 * @returns PEC correction values
 */
export function generatePECTable(
  periodicError: PeriodicErrorAnalysis,
  numPoints: number = 360
): number[] {
  const pecTable: number[] = new Array(numPoints);

  for (let i = 0; i < numPoints; i++) {
    const phase = (i / numPoints) * 2 * Math.PI;
    const correction = periodicError.amplitude * Math.sin(phase + periodicError.phase);
    pecTable[i] = correction;
  }

  return pecTable;
}

/**
 * Estimate worm gear period from periodic error frequency
 * 
 * @param frequency - Periodic error frequency in Hz
 * @returns Estimated worm gear period in seconds
 */
export function estimateWormPeriod(frequency: number): number {
  // Frequency is cycles per second, period is seconds per cycle
  return 1 / frequency;
}

export interface MultiSessionComparison {
  sessions: SessionComparisonData[];
  overallStats: {
    averageRMS: number;
    bestRMS: number;
    worstRMS: number;
    improvementTrend: number; // percentage change over sessions
    consistencyScore: number; // lower variance = more consistent
  };
  equipmentChanges: EquipmentChange[];
}

export interface SessionComparisonData {
  sessionId: string;
  sessionDate: Date;
  duration: number;
  frameCount: number;
  rmsTotal: number;
  rmsRA: number;
  rmsDec: number;
  perfectPercentage: number;
  goodPercentage: number;
  pixelScale: number;
  equipment: {
    mount?: string;
    camera?: string;
    telescope?: string;
  };
}

export interface EquipmentChange {
  sessionIndex: number;
  changeType: 'mount' | 'camera' | 'telescope' | 'pixelScale';
  oldValue: string;
  newValue: string;
  impact: 'positive' | 'negative' | 'neutral';
}

/**
 * Compare multiple guiding sessions for performance analysis
 * 
 * @param sessions - Array of guiding sessions to compare
 * @returns Comprehensive multi-session comparison data
 */
export function compareMultipleSessions(
  sessions: GuidingSession[]
): MultiSessionComparison {
  if (!sessions || sessions.length === 0) {
    return {
      sessions: [],
      overallStats: {
        averageRMS: 0,
        bestRMS: 0,
        worstRMS: 0,
        improvementTrend: 0,
        consistencyScore: 0
      },
      equipmentChanges: []
    };
  }

  // Analyze each session individually
  const sessionComparisons: SessionComparisonData[] = sessions.map((session, index) => {
    const analysis = analyzeDrift(session.guidingFrames, session.pixelScale, []);
    const qualityStats = calculateQualityPercentages(
      session.guidingFrames.map((frame, i) => ({
        x: frame.dx * session.pixelScale,
        y: frame.dy * session.pixelScale,
        totalXY: Math.sqrt(frame.dx * frame.dx + frame.dy * frame.dy) * session.pixelScale,
        timestamp: frame.datetime,
        index: i,
        frame: frame.frame
      })),
      session.pixelScale
    );

    return {
      sessionId: `Session ${index + 1}`,
      sessionDate: session.startTime,
      duration: session.endTime.getTime() - session.startTime.getTime(),
      frameCount: session.guidingFrames.length,
      rmsTotal: analysis ? Math.sqrt(
        analysis.driftVectors.reduce((sum, v) => sum + v.driftRate * v.driftRate, 0) / analysis.driftVectors.length
      ) : 0,
      rmsRA: analysis ? Math.sqrt(
        analysis.driftVectors.reduce((sum, v) => sum + v.raDrift * v.raDrift, 0) / analysis.driftVectors.length
      ) : 0,
      rmsDec: analysis ? Math.sqrt(
        analysis.driftVectors.reduce((sum, v) => sum + v.decDrift * v.decDrift, 0) / analysis.driftVectors.length
      ) : 0,
      perfectPercentage: qualityStats.perfectPercentage,
      goodPercentage: qualityStats.goodPercentage,
      pixelScale: session.pixelScale,
      equipment: {
        mount: session.mount,
        camera: session.camera,
        telescope: session.equipmentProfile
      }
    };
  });

  // Calculate overall statistics
  const rmsValues = sessionComparisons.map(s => s.rmsTotal).filter(rms => rms > 0);
  const averageRMS = rmsValues.length > 0 ? rmsValues.reduce((sum, rms) => sum + rms, 0) / rmsValues.length : 0;
  const bestRMS = rmsValues.length > 0 ? Math.min(...rmsValues) : 0;
  const worstRMS = rmsValues.length > 0 ? Math.max(...rmsValues) : 0;

  // Calculate improvement trend (percentage change from first to last session)
  let improvementTrend = 0;
  if (rmsValues.length >= 2) {
    const firstRMS = rmsValues[0];
    const lastRMS = rmsValues[rmsValues.length - 1];
    improvementTrend = firstRMS > 0 ? ((firstRMS - lastRMS) / firstRMS) * 100 : 0;
  }

  // Calculate consistency score (coefficient of variation)
  const rmsVariance = rmsValues.length > 0 ?
    rmsValues.reduce((sum, rms) => sum + Math.pow(rms - averageRMS, 2), 0) / rmsValues.length : 0;
  const rmsStdDev = Math.sqrt(rmsVariance);
  const consistencyScore = averageRMS > 0 ? (rmsStdDev / averageRMS) * 100 : 0;

  // Detect equipment changes
  const equipmentChanges = detectEquipmentChanges(sessionComparisons);

  return {
    sessions: sessionComparisons,
    overallStats: {
      averageRMS,
      bestRMS,
      worstRMS,
      improvementTrend,
      consistencyScore
    },
    equipmentChanges
  };
}

/**
 * Detect equipment changes across sessions
 * 
 * @param sessions - Array of session comparison data
 * @returns Array of detected equipment changes
 */
function detectEquipmentChanges(sessions: SessionComparisonData[]): EquipmentChange[] {
  const changes: EquipmentChange[] = [];

  for (let i = 1; i < sessions.length; i++) {
    const prevSession = sessions[i - 1];
    const currentSession = sessions[i];

    // Check mount changes
    if (prevSession.equipment.mount !== currentSession.equipment.mount) {
      changes.push({
        sessionIndex: i,
        changeType: 'mount',
        oldValue: prevSession.equipment.mount || 'Unknown',
        newValue: currentSession.equipment.mount || 'Unknown',
        impact: 'neutral' // Mount changes can be positive or negative depending on quality
      });
    }

    // Check camera changes
    if (prevSession.equipment.camera !== currentSession.equipment.camera) {
      changes.push({
        sessionIndex: i,
        changeType: 'camera',
        oldValue: prevSession.equipment.camera || 'Unknown',
        newValue: currentSession.equipment.camera || 'Unknown',
        impact: 'neutral'
      });
    }

    // Check telescope/equipment profile changes
    if (prevSession.equipment.telescope !== currentSession.equipment.telescope) {
      changes.push({
        sessionIndex: i,
        changeType: 'telescope',
        oldValue: prevSession.equipment.telescope || 'Unknown',
        newValue: currentSession.equipment.telescope || 'Unknown',
        impact: 'neutral'
      });
    }

    // Check pixel scale changes (might indicate focal length or camera changes)
    if (Math.abs(prevSession.pixelScale - currentSession.pixelScale) > 0.1) {
      changes.push({
        sessionIndex: i,
        changeType: 'pixelScale',
        oldValue: prevSession.pixelScale.toFixed(2) + '"',
        newValue: currentSession.pixelScale.toFixed(2) + '"',
        impact: Math.abs(prevSession.pixelScale - currentSession.pixelScale) > 0.5 ? 'neutral' : 'neutral'
      });
    }
  }

  return changes;
}

/**
 * Generate overlay chart data for multiple sessions
 * 
 * @param sessions - Array of guiding sessions
 * @param pixelScale - Pixel scale to normalize data
 * @returns Chart data for multi-session overlay
 */
export function generateMultiSessionOverlay(
  sessions: GuidingSession[],
  pixelScale: number
): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
    pointRadius: number;
  }>;
} {
  const datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
    pointRadius: number;
  }> = [];

  const colors = [
    'rgba(255, 99, 132, 1)',   // Red
    'rgba(54, 162, 235, 1)',   // Blue
    'rgba(255, 205, 86, 1)',   // Yellow
    'rgba(75, 192, 192, 1)',   // Teal
    'rgba(153, 102, 255, 1)',  // Purple
    'rgba(255, 159, 64, 1)',   // Orange
  ];

  sessions.forEach((session, sessionIndex) => {
    if (!session.guidingFrames || session.guidingFrames.length === 0) return;

    const driftAnalysis = analyzeDrift(session.guidingFrames, pixelScale, []);
    if (!driftAnalysis || driftAnalysis.driftVectors.length === 0) return;

    // Sample drift vectors for chart performance (max 200 points per session)
    const sampledVectors = driftAnalysis.driftVectors.filter((_, i) =>
      i % Math.ceil(driftAnalysis.driftVectors.length / 200) === 0
    );

    const colorIndex = sessionIndex % colors.length;

    datasets.push({
      label: `Session ${sessionIndex + 1} (${new Date(session.startTime).toLocaleDateString()})`,
      data: sampledVectors.map(v => v.driftRate),
      borderColor: colors[colorIndex],
      backgroundColor: colors[colorIndex].replace('1)', '0.1)'),
      borderWidth: 2,
      fill: false,
      pointRadius: 1
    });
  });

  // Generate time labels (assuming consistent sampling)
  const maxLength = Math.max(...datasets.map(d => d.data.length));
  const labels = Array.from({ length: maxLength }, (_, i) => `Point ${i + 1}`);

  return { labels, datasets };
}
