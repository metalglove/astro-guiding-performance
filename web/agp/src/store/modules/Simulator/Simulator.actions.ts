/**
 * Simulator module actions
 *
 * Async operations and business logic for the simulator
 */

import { ActionContext, ActionTree } from 'vuex';
import { RootState } from '@/store';
import { ISimulatorState, SimulatorFrame, SessionMetadata, Star } from './Simulator.types';
import { SimulatorMutationTypes } from './Simulator.mutations';
import { PHDLog, GuidingSession } from '../PHD/PHD.types';
import { ASIAIRLog } from '../ASIAIR/ASIAIR.types';

export enum SimulatorActionTypes {
  INITIALIZE_SESSION = 'INITIALIZE_SESSION',
  LOAD_STAR_DATABASE = 'LOAD_STAR_DATABASE',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  TOGGLE_PLAY_PAUSE = 'TOGGLE_PLAY_PAUSE',
  STEP_FORWARD = 'STEP_FORWARD',
  STEP_BACKWARD = 'STEP_BACKWARD',
  SEEK_TO_FRAME = 'SEEK_TO_FRAME',
  SET_PLAYBACK_SPEED = 'SET_PLAYBACK_SPEED',
  SET_STAR_MAGNITUDE_FILTER = 'SET_STAR_MAGNITUDE_FILTER',
  RESET_SESSION = 'RESET_SESSION',
}

type AugmentedActionContext = {
  commit<K extends keyof typeof SimulatorMutationTypes>(
    key: K,
    payload?: any
  ): void;
} & Omit<ActionContext<ISimulatorState, RootState>, 'commit'>;

export interface SimulatorActions {
  [SimulatorActionTypes.INITIALIZE_SESSION](
    { commit, dispatch, state }: AugmentedActionContext,
    payload: { phdLog: PHDLog; asiairLog?: ASIAIRLog; sessionIndex?: number }
  ): Promise<void>;

  [SimulatorActionTypes.LOAD_STAR_DATABASE](
    { commit, state }: AugmentedActionContext
  ): Promise<void>;

  [SimulatorActionTypes.PLAY](
    { commit }: AugmentedActionContext
  ): void;

  [SimulatorActionTypes.PAUSE](
    { commit }: AugmentedActionContext
  ): void;

  [SimulatorActionTypes.TOGGLE_PLAY_PAUSE](
    { commit, state }: AugmentedActionContext
  ): void;

  [SimulatorActionTypes.STEP_FORWARD](
    { commit, state }: AugmentedActionContext
  ): void;

  [SimulatorActionTypes.STEP_BACKWARD](
    { commit, state }: AugmentedActionContext
  ): void;

  [SimulatorActionTypes.SEEK_TO_FRAME](
    { commit }: AugmentedActionContext,
    index: number
  ): void;

  [SimulatorActionTypes.SET_PLAYBACK_SPEED](
    { commit }: AugmentedActionContext,
    speed: number
  ): void;

  [SimulatorActionTypes.SET_STAR_MAGNITUDE_FILTER](
    { commit }: AugmentedActionContext,
    magnitude: number
  ): void;

  [SimulatorActionTypes.RESET_SESSION](
    { commit }: AugmentedActionContext
  ): void;
}

export const simulatorActions: ActionTree<ISimulatorState, RootState> & SimulatorActions = {
  /**
   * Initialize simulator session from PHD2 log data
   */
  async [SimulatorActionTypes.INITIALIZE_SESSION](
    { commit, dispatch, state },
    { phdLog, asiairLog, sessionIndex = 0 }
  ) {
    commit(SimulatorMutationTypes.SET_LOADING, true);
    commit(SimulatorMutationTypes.SET_ERROR, null);

    try {
      // Validate input
      if (!phdLog || !phdLog.guidingSessions || phdLog.guidingSessions.length === 0) {
        throw new Error('No guiding sessions found in PHD2 log');
      }

      if (sessionIndex < 0 || sessionIndex >= phdLog.guidingSessions.length) {
        throw new Error(`Invalid session index: ${sessionIndex}`);
      }

      const session: GuidingSession = phdLog.guidingSessions[sessionIndex];

      // Build frames from guiding data
      const frames: SimulatorFrame[] = [];

      for (let i = 0; i < session.guidingFrames.length; i++) {
        const frame = session.guidingFrames[i];

        // Skip dropped frames
        if (frame.mount === 'DROP') {
          continue;
        }

        // Calculate errors in arcseconds
        const pixelScale = session.pixelScale;
        const raError = Math.abs(frame.RARawDistance * pixelScale);
        const decError = Math.abs(frame.DECRawDistance * pixelScale);
        const totalError = Math.sqrt(raError ** 2 + decError ** 2);

        // TODO: Calculate actual RA from hour angle + LST
        // For now, use a placeholder based on Dec and HA
        const ra = session.degrees; // This needs proper calculation

        const simulatorFrame: SimulatorFrame = {
          timestamp: frame.datetime,
          frameNumber: frame.frame,

          // Position data
          dec: session.degrees,
          hourAngle: session.hourAngle,
          ra: ra,
          pierSide: session.pierSide as 'East' | 'West',

          // Error data
          raError,
          decError,
          totalError,
          snr: frame.SNR,
          starMass: frame.StarMass,
        };

        // Add target info from ASIAIR if available
        if (asiairLog) {
          // TODO: Extract target from ASIAIR log
          // For now, placeholder
          simulatorFrame.targetRA = undefined;
          simulatorFrame.targetDec = undefined;
          simulatorFrame.targetName = undefined;
        }

        frames.push(simulatorFrame);
      }

      // Ensure dates are Date objects (in case they were deserialized as strings)
      const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
      const endTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);

      // Build session metadata
      const metadata: SessionMetadata = {
        startTime,
        endTime,
        duration: (endTime.getTime() - startTime.getTime()) / 1000,

        // Equipment specs (using data from session)
        telescope: {
          id: 'session-telescope',
          name: 'Session Telescope',
          type: 'other',
          aperture: 0, // Not available in PHD log
          focalLength: session.focalLength,
          focalRatio: 0,
        },
        camera: {
          id: 'session-camera',
          name: session.camera,
          type: 'guiding',
          manufacturer: '',
          model: session.camera,
          pixelSize: session.cameraPixelSize,
          width: session.cameraWidth,
          height: session.cameraHeight,
          sensorType: 'CMOS',
          cooled: false,
        },
        mount: {
          id: 'session-mount',
          name: session.mount,
          manufacturer: '',
          model: session.mount,
          type: 'equatorial',
          payload: 0,
        },

        pixelScale: session.pixelScale,
        fov: {
          width: (session.cameraWidth * session.pixelScale) / 60, // arcminutes
          height: (session.cameraHeight * session.pixelScale) / 60,
        },

        // Location not available in PHD log
        location: undefined,
      };

      // Commit to store
      commit(SimulatorMutationTypes.SET_FRAMES, frames);
      commit(SimulatorMutationTypes.SET_SESSION_METADATA, metadata);
      commit(SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX, 0);

      // Load star database if not already loaded
      if (!state.isStarsLoaded) {
        await dispatch(SimulatorActionTypes.LOAD_STAR_DATABASE);
      }

      commit(SimulatorMutationTypes.SET_LOADING, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      commit(SimulatorMutationTypes.SET_ERROR, `Failed to initialize session: ${errorMessage}`);
      commit(SimulatorMutationTypes.SET_LOADING, false);
      throw error;
    }
  },

  /**
   * Load HYG star database from public data directory
   */
  async [SimulatorActionTypes.LOAD_STAR_DATABASE]({ commit, state }) {
    if (state.isStarsLoaded) {
      return; // Already loaded
    }

    commit(SimulatorMutationTypes.SET_LOADING, true);

    try {
      // TODO: Implement actual HYG database loading
      // For now, create placeholder empty array
      // In next iteration, we'll fetch /data/hyg_v37.csv.gz

      console.log('Star database loading will be implemented in Phase 2');

      // Placeholder: empty star array
      const stars: Star[] = [];

      commit(SimulatorMutationTypes.SET_STARS, stars);
      commit(SimulatorMutationTypes.SET_STARS_LOADED, true);
      commit(SimulatorMutationTypes.SET_LOADING, false);
    } catch (error) {
      console.error('Failed to load star database:', error);
      // Don't throw - simulator can work without stars
      commit(SimulatorMutationTypes.SET_STARS, []);
      commit(SimulatorMutationTypes.SET_STARS_LOADED, false);
      commit(SimulatorMutationTypes.SET_LOADING, false);
    }
  },

  /**
   * Start playback
   */
  [SimulatorActionTypes.PLAY]({ commit }) {
    commit(SimulatorMutationTypes.SET_PLAYING, true);
  },

  /**
   * Pause playback
   */
  [SimulatorActionTypes.PAUSE]({ commit }) {
    commit(SimulatorMutationTypes.SET_PLAYING, false);
  },

  /**
   * Toggle play/pause
   */
  [SimulatorActionTypes.TOGGLE_PLAY_PAUSE]({ commit, state }) {
    commit(SimulatorMutationTypes.SET_PLAYING, !state.isPlaying);
  },

  /**
   * Step forward one frame
   */
  [SimulatorActionTypes.STEP_FORWARD]({ commit, state }) {
    const nextIndex = state.currentFrameIndex + 1;
    if (nextIndex < state.frameCount) {
      commit(SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX, nextIndex);
    }
  },

  /**
   * Step backward one frame
   */
  [SimulatorActionTypes.STEP_BACKWARD]({ commit, state }) {
    const prevIndex = state.currentFrameIndex - 1;
    if (prevIndex >= 0) {
      commit(SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX, prevIndex);
    }
  },

  /**
   * Seek to specific frame index
   */
  [SimulatorActionTypes.SEEK_TO_FRAME]({ commit }, index: number) {
    commit(SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX, index);
  },

  /**
   * Set playback speed multiplier
   */
  [SimulatorActionTypes.SET_PLAYBACK_SPEED]({ commit }, speed: number) {
    // Validate speed (1, 10, 100, 1000)
    const validSpeeds = [1, 10, 100, 1000];
    if (!validSpeeds.includes(speed)) {
      console.warn(`Invalid playback speed: ${speed}. Using 1x.`);
      speed = 1;
    }
    commit(SimulatorMutationTypes.SET_PLAYBACK_SPEED, speed);
  },

  /**
   * Set star magnitude filter
   */
  [SimulatorActionTypes.SET_STAR_MAGNITUDE_FILTER]({ commit }, magnitude: number) {
    commit(SimulatorMutationTypes.SET_STAR_MAGNITUDE_FILTER, magnitude);
  },

  /**
   * Reset session (clear frames and metadata)
   */
  [SimulatorActionTypes.RESET_SESSION]({ commit }) {
    commit(SimulatorMutationTypes.RESET_STATE);
  },
};
