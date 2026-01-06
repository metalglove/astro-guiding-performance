/**
 * Simulator module mutations
 *
 * Synchronous state updates for the simulator
 */

import { MutationTree } from 'vuex';
import { ISimulatorState, SimulatorFrame, SessionMetadata, Star } from './Simulator.types';

export enum SimulatorMutationTypes {
  SET_PLAYING = 'SET_PLAYING',
  SET_CURRENT_FRAME_INDEX = 'SET_CURRENT_FRAME_INDEX',
  SET_PLAYBACK_SPEED = 'SET_PLAYBACK_SPEED',
  SET_FRAMES = 'SET_FRAMES',
  SET_SESSION_METADATA = 'SET_SESSION_METADATA',
  SET_STARS = 'SET_STARS',
  SET_STARS_LOADED = 'SET_STARS_LOADED',
  SET_STAR_MAGNITUDE_FILTER = 'SET_STAR_MAGNITUDE_FILTER',
  SET_VIEW_VISIBILITY = 'SET_VIEW_VISIBILITY',
  SET_TRACK_TARGET = 'SET_TRACK_TARGET',
  SET_ERROR = 'SET_ERROR',
  SET_LOADING = 'SET_LOADING',
  RESET_STATE = 'RESET_STATE',
}

export type SimulatorMutations = {
  [SimulatorMutationTypes.SET_PLAYING](state: ISimulatorState, isPlaying: boolean): void;
  [SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX](state: ISimulatorState, index: number): void;
  [SimulatorMutationTypes.SET_PLAYBACK_SPEED](state: ISimulatorState, speed: number): void;
  [SimulatorMutationTypes.SET_FRAMES](state: ISimulatorState, frames: SimulatorFrame[]): void;
  [SimulatorMutationTypes.SET_SESSION_METADATA](state: ISimulatorState, metadata: SessionMetadata): void;
  [SimulatorMutationTypes.SET_STARS](state: ISimulatorState, stars: Star[]): void;
  [SimulatorMutationTypes.SET_STARS_LOADED](state: ISimulatorState, loaded: boolean): void;
  [SimulatorMutationTypes.SET_STAR_MAGNITUDE_FILTER](state: ISimulatorState, magnitude: number): void;
  [SimulatorMutationTypes.SET_VIEW_VISIBILITY](state: ISimulatorState, payload: { view: '3d' | '2d'; visible: boolean }): void;
  [SimulatorMutationTypes.SET_TRACK_TARGET](state: ISimulatorState, track: boolean): void;
  [SimulatorMutationTypes.SET_ERROR](state: ISimulatorState, error: string | null): void;
  [SimulatorMutationTypes.SET_LOADING](state: ISimulatorState, loading: boolean): void;
  [SimulatorMutationTypes.RESET_STATE](state: ISimulatorState): void;
};

export const simulatorMutations: MutationTree<ISimulatorState> & SimulatorMutations = {
  /**
   * Set playback playing/paused state
   */
  [SimulatorMutationTypes.SET_PLAYING](state: ISimulatorState, isPlaying: boolean): void {
    state.isPlaying = isPlaying;
  },

  /**
   * Set current frame index
   */
  [SimulatorMutationTypes.SET_CURRENT_FRAME_INDEX](state: ISimulatorState, index: number): void {
    if (index >= 0 && index < state.frameCount) {
      state.currentFrameIndex = index;
    }
  },

  /**
   * Set playback speed multiplier
   */
  [SimulatorMutationTypes.SET_PLAYBACK_SPEED](state: ISimulatorState, speed: number): void {
    state.playbackSpeed = speed;
  },

  /**
   * Set frames array and update count
   */
  [SimulatorMutationTypes.SET_FRAMES](state: ISimulatorState, frames: SimulatorFrame[]): void {
    state.frames = frames;
    state.frameCount = frames.length;
  },

  /**
   * Set session metadata
   */
  [SimulatorMutationTypes.SET_SESSION_METADATA](state: ISimulatorState, metadata: SessionMetadata): void {
    state.sessionMetadata = metadata;
  },

  /**
   * Set star database
   */
  [SimulatorMutationTypes.SET_STARS](state: ISimulatorState, stars: Star[]): void {
    state.stars = stars;
  },

  /**
   * Set stars loaded flag
   */
  [SimulatorMutationTypes.SET_STARS_LOADED](state: ISimulatorState, loaded: boolean): void {
    state.isStarsLoaded = loaded;
  },

  /**
   * Set star magnitude filter threshold
   */
  [SimulatorMutationTypes.SET_STAR_MAGNITUDE_FILTER](state: ISimulatorState, magnitude: number): void {
    state.starMagnitudeFilter = magnitude;
  },

  /**
   * Set 3D or 2D view visibility
   */
  [SimulatorMutationTypes.SET_VIEW_VISIBILITY](
    state: ISimulatorState,
    payload: { view: '3d' | '2d'; visible: boolean }
  ): void {
    if (payload.view === '3d') {
      state.show3DView = payload.visible;
    } else {
      state.show2DView = payload.visible;
    }
  },

  /**
   * Set target tracking mode
   */
  [SimulatorMutationTypes.SET_TRACK_TARGET](state: ISimulatorState, track: boolean): void {
    state.trackTarget = track;
  },

  /**
   * Set error message
   */
  [SimulatorMutationTypes.SET_ERROR](state: ISimulatorState, error: string | null): void {
    state.error = error;
  },

  /**
   * Set loading state
   */
  [SimulatorMutationTypes.SET_LOADING](state: ISimulatorState, loading: boolean): void {
    state.isLoading = loading;
  },

  /**
   * Reset state to initial values (except stars - keep loaded)
   */
  [SimulatorMutationTypes.RESET_STATE](state: ISimulatorState): void {
    state.isPlaying = false;
    state.currentFrameIndex = 0;
    state.playbackSpeed = 1;
    state.frames = [];
    state.frameCount = 0;
    state.sessionMetadata = null;
    state.error = null;
    state.isLoading = false;
    // Keep stars loaded and view settings
  },
};
