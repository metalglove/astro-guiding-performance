/**
 * Simulator module getters
 *
 * Computed properties derived from simulator state
 */

import { GetterTree } from 'vuex';
import { RootState } from '@/store';
import { ISimulatorState, SimulatorFrame, Star } from './Simulator.types';

export enum SimulatorGetterTypes {
  GET_CURRENT_FRAME = 'GET_CURRENT_FRAME',
  GET_FRAME_AT = 'GET_FRAME_AT',
  GET_VISIBLE_STARS = 'GET_VISIBLE_STARS',
  GET_SESSION_PROGRESS = 'GET_SESSION_PROGRESS',
  GET_IS_PLAYING = 'GET_IS_PLAYING',
  GET_PLAYBACK_SPEED = 'GET_PLAYBACK_SPEED',
  GET_SESSION_METADATA = 'GET_SESSION_METADATA',
  GET_FRAMES = 'GET_FRAMES',
  GET_FRAME_COUNT = 'GET_FRAME_COUNT',
  GET_IS_STARS_LOADED = 'GET_IS_STARS_LOADED',
  GET_ERROR = 'GET_ERROR',
  GET_IS_LOADING = 'GET_IS_LOADING',
}

export type SimulatorGetters = {
  [SimulatorGetterTypes.GET_CURRENT_FRAME](state: ISimulatorState): SimulatorFrame | null;
  [SimulatorGetterTypes.GET_FRAME_AT](state: ISimulatorState): (index: number) => SimulatorFrame | null;
  [SimulatorGetterTypes.GET_VISIBLE_STARS](state: ISimulatorState): Star[];
  [SimulatorGetterTypes.GET_SESSION_PROGRESS](state: ISimulatorState): number;
  [SimulatorGetterTypes.GET_IS_PLAYING](state: ISimulatorState): boolean;
  [SimulatorGetterTypes.GET_PLAYBACK_SPEED](state: ISimulatorState): number;
  [SimulatorGetterTypes.GET_SESSION_METADATA](state: ISimulatorState): ISimulatorState['sessionMetadata'];
  [SimulatorGetterTypes.GET_FRAMES](state: ISimulatorState): SimulatorFrame[];
  [SimulatorGetterTypes.GET_FRAME_COUNT](state: ISimulatorState): number;
  [SimulatorGetterTypes.GET_IS_STARS_LOADED](state: ISimulatorState): boolean;
  [SimulatorGetterTypes.GET_ERROR](state: ISimulatorState): string | null;
  [SimulatorGetterTypes.GET_IS_LOADING](state: ISimulatorState): boolean;
};

export const simulatorGetters: GetterTree<ISimulatorState, RootState> & SimulatorGetters = {
  /**
   * Get the current frame based on currentFrameIndex
   */
  [SimulatorGetterTypes.GET_CURRENT_FRAME](state: ISimulatorState): SimulatorFrame | null {
    if (state.frames.length === 0 || state.currentFrameIndex >= state.frames.length) {
      return null;
    }
    return state.frames[state.currentFrameIndex];
  },

  /**
   * Get frame at specific index
   */
  [SimulatorGetterTypes.GET_FRAME_AT](state: ISimulatorState) {
    return (index: number): SimulatorFrame | null => {
      if (index < 0 || index >= state.frames.length) {
        return null;
      }
      return state.frames[index];
    };
  },

  /**
   * Get visible stars filtered by magnitude
   */
  [SimulatorGetterTypes.GET_VISIBLE_STARS](state: ISimulatorState): Star[] {
    return state.stars.filter(star => star.mag <= state.starMagnitudeFilter);
  },

  /**
   * Get session progress as percentage (0-100)
   */
  [SimulatorGetterTypes.GET_SESSION_PROGRESS](state: ISimulatorState): number {
    if (state.frameCount === 0) {
      return 0;
    }
    return (state.currentFrameIndex / (state.frameCount - 1)) * 100;
  },

  /**
   * Get playback state
   */
  [SimulatorGetterTypes.GET_IS_PLAYING](state: ISimulatorState): boolean {
    return state.isPlaying;
  },

  /**
   * Get playback speed multiplier
   */
  [SimulatorGetterTypes.GET_PLAYBACK_SPEED](state: ISimulatorState): number {
    return state.playbackSpeed;
  },

  /**
   * Get session metadata
   */
  [SimulatorGetterTypes.GET_SESSION_METADATA](state: ISimulatorState) {
    return state.sessionMetadata;
  },

  /**
   * Get all frames
   */
  [SimulatorGetterTypes.GET_FRAMES](state: ISimulatorState): SimulatorFrame[] {
    return state.frames;
  },

  /**
   * Get frame count
   */
  [SimulatorGetterTypes.GET_FRAME_COUNT](state: ISimulatorState): number {
    return state.frameCount;
  },

  /**
   * Check if stars are loaded
   */
  [SimulatorGetterTypes.GET_IS_STARS_LOADED](state: ISimulatorState): boolean {
    return state.isStarsLoaded;
  },

  /**
   * Get error message
   */
  [SimulatorGetterTypes.GET_ERROR](state: ISimulatorState): string | null {
    return state.error;
  },

  /**
   * Get loading state
   */
  [SimulatorGetterTypes.GET_IS_LOADING](state: ISimulatorState): boolean {
    return state.isLoading;
  },
};
