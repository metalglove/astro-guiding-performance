/**
 * TypeScript type definitions for the Simulator store module
 *
 * This module handles telescope positioning simulation state,
 * including playback controls, frame data, and star database.
 */

import type { TelescopeSpecs, CameraSpecs, MountSpecs } from '@/store/modules/Equipment/Equipment.types';

/**
 * Individual frame in the simulation with telescope position and tracking data
 */
export interface SimulatorFrame {
  timestamp: Date;
  frameNumber: number;

  // Telescope pointing (equatorial coordinates)
  ra: number;              // Right Ascension in degrees
  dec: number;             // Declination in degrees
  hourAngle: number;       // Hour angle in hours
  pierSide: 'East' | 'West';

  // Tracking errors (converted to arcseconds)
  raError: number;         // RA error in arcseconds
  decError: number;        // Dec error in arcseconds
  totalError: number;      // Total RMS error in arcseconds

  // Guide star quality
  snr: number;             // Signal-to-noise ratio
  starMass: number;        // Star brightness/mass

  // Optional target info (from ASIAIR logs)
  targetRA?: number;       // Target RA in degrees
  targetDec?: number;      // Target Dec in degrees
  targetName?: string;
}

/**
 * Session metadata including equipment and timing information
 */
export interface SessionMetadata {
  startTime: Date;
  endTime: Date;
  duration: number;        // Duration in seconds

  // Equipment used
  telescope: TelescopeSpecs;
  camera: CameraSpecs;
  mount: MountSpecs;

  // Calculated values
  pixelScale: number;      // Arcseconds per pixel
  fov: {
    width: number;         // Field of view width in arcminutes
    height: number;        // Field of view height in arcminutes
  };

  // Optional location (for sidereal time calculations)
  location?: {
    latitude: number;      // Degrees
    longitude: number;     // Degrees
    elevation: number;     // Meters
  };
}

/**
 * Star from HYG database
 */
export interface Star {
  id: number;
  ra: number;              // Right Ascension in hours
  dec: number;             // Declination in degrees
  mag: number;             // Apparent magnitude
  name?: string;           // Proper name if available
}

/**
 * Simulator module state
 */
export interface ISimulatorState {
  // Playback state
  isPlaying: boolean;
  currentFrameIndex: number;
  playbackSpeed: number;   // Multiplier: 1, 10, 100, 1000

  // Session data
  frames: SimulatorFrame[];
  frameCount: number;
  sessionMetadata: SessionMetadata | null;

  // Star database
  stars: Star[];
  isStarsLoaded: boolean;
  starMagnitudeFilter: number;  // Default 6.5 (naked eye limit)

  // View settings
  show3DView: boolean;
  show2DView: boolean;
  trackTarget: boolean;    // Keep target centered in 2D view

  // Error state
  error: string | null;
  isLoading: boolean;
}

export { TelescopeSpecs, CameraSpecs, MountSpecs };
