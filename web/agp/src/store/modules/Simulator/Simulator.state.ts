/**
 * Simulator module state initialization
 */

import { ISimulatorState } from './Simulator.types';

export const simulatorState: ISimulatorState = {
  // Playback state
  isPlaying: false,
  currentFrameIndex: 0,
  playbackSpeed: 1,

  // Session data
  frames: [],
  frameCount: 0,
  sessionMetadata: null,

  // Star database
  stars: [],
  isStarsLoaded: false,
  starMagnitudeFilter: 6.5,

  // View settings
  show3DView: true,
  show2DView: true,
  trackTarget: true,

  // Error state
  error: null,
  isLoading: false,
};
