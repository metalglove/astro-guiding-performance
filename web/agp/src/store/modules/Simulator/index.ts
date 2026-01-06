/**
 * Simulator store module
 *
 * Handles telescope positioning simulation state and logic
 */

import { Store, CommitOptions, DispatchOptions, Module } from 'vuex';
import { RootState } from '@/store';
import { SimulatorActions, simulatorActions } from './Simulator.actions';
import { SimulatorGetters, simulatorGetters } from './Simulator.getters';
import { SimulatorMutations, simulatorMutations } from './Simulator.mutations';
import { ISimulatorState as State, simulatorState } from './Simulator.state';

export type ISimulatorState = State;

export type SimulatorModule = {
  namespaced?: boolean;
  state?: ISimulatorState;
  mutations?: SimulatorMutations;
  actions?: SimulatorActions;
  getters?: SimulatorGetters;
};

export type SimulatorStore<S = ISimulatorState> = Omit<Store<S>, 'getters' | 'commit' | 'dispatch'>
  & {
    commit<K extends keyof SimulatorMutations, P extends Parameters<SimulatorMutations[K]>[1]>(
      key: K,
      payload: P,
      options?: CommitOptions
    ): ReturnType<SimulatorMutations[K]>;
  } & {
    dispatch<K extends keyof SimulatorActions, P extends Parameters<SimulatorActions[K]>[1]>(
      key: K,
      payload: P,
      options?: DispatchOptions
    ): ReturnType<SimulatorActions[K]>;
  } & {
    getters: {
      [K in keyof SimulatorGetters]: ReturnType<SimulatorGetters[K]>
    };
  };

export const simulatorStore: Module<ISimulatorState, RootState> & SimulatorModule = {
  namespaced: true,
  state: simulatorState,
  mutations: simulatorMutations,
  actions: simulatorActions,
  getters: simulatorGetters,
};

// Re-export types and enums for convenience
export * from './Simulator.types';
export { SimulatorGetterTypes } from './Simulator.getters';
export { SimulatorMutationTypes } from './Simulator.mutations';
export { SimulatorActionTypes } from './Simulator.actions';
