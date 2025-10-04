import { InjectionKey } from 'vue';
import { CommitOptions, createStore, DispatchOptions, Store } from 'vuex';
import { useStore as vuexUseStore } from 'vuex';

import { IAppState, AppStore, appStore } from './modules/App';
import { AppActions, AppActionTypes } from './modules/App/App.actions';
import { AppGetters, AppGetterTypes } from './modules/App/App.getters';
import { AppMutations, AppMutationTypes } from './modules/App/App.mutations';

import { IPHDState, PHDStore, phdStore } from './modules/PHD';
import { PHDActions, PHDActionTypes } from './modules/PHD/PHD.actions';
import { PHDGetters, PHDGetterTypes } from './modules/PHD/PHD.getters';
import { PHDMutations, PHDMutationTypes } from './modules/PHD/PHD.mutations';

import { IASIAIRState, ASIAIRStore, asiairStore } from './modules/ASIAIR';
import { ASIAIRActions, ASIAIRActionTypes } from './modules/ASIAIR/ASIAIR.actions';
import { ASIAIRGetters, ASIAIRGetterTypes } from './modules/ASIAIR/ASIAIR.getters';
import { ASIAIRMutations, ASIAIRMutationTypes } from './modules/ASIAIR/ASIAIR.mutations';

import { IEquipmentState, EquipmentStore, equipmentStore } from './modules/Equipment';
import { EquipmentActions, EquipmentActionTypes } from './modules/Equipment/Equipment.actions';
import { EquipmentGetters, EquipmentGetterTypes } from './modules/Equipment/Equipment.getters';
import { EquipmentMutations, EquipmentMutationTypes } from './modules/Equipment/Equipment.mutations';
// No need to import specific types - they're inferred from ReturnType<Getters[T]>

export interface RootState {
  app: IAppState;
  phd: IPHDState;
  asiair: IASIAIRState;
  equipment: IEquipmentState;
  [key: string]: any;
}

export type RootStore =
  AppStore<Pick<RootState, 'app'>> &
  PHDStore<Pick<RootState, 'phd'>> &
  ASIAIRStore<Pick<RootState, 'asiair'>> &
  EquipmentStore<Pick<RootState, 'equipment'>>;

export const rootStore = createStore({
  modules: {
    app: appStore,
    phd: phdStore,
    asiair: asiairStore,
    equipment: equipmentStore,
  }
});

export const rootStoreKey: InjectionKey<Store<RootState>> = Symbol()

export function useStore(): Store<RootState> {
  const store = vuexUseStore(rootStoreKey);
  return store;
}

function rootStoreToNamespacedStore<ActionTypes, Actions, MutationsTypes, Mutations, GetterTypes, Getters, StateType>(
  namespace: string,
  store: Store<RootState>
) {
  return {
    getters: (getterType: GetterTypes): any => {
      return store.getters[`${namespace}/${getterType}`];
    },
    dispatch: (payloadWithType: ActionTypes, payload?: any, options?: DispatchOptions): Promise<any> => {
      return store.dispatch(`${namespace}/${payloadWithType}`, payload, options);
    },
    commit: (payloadWithType: MutationsTypes, payload?: any, options?: CommitOptions): void => {
      return store.commit(`${namespace}/${payloadWithType}`, payload, options)
    },
    state: store.state[namespace] as StateType
  };
}

// Create specific typed store interfaces with automatic type inference
interface AppStoreInterface {
  getters<T extends AppGetterTypes>(getterType: T): T extends keyof AppGetters ? ReturnType<AppGetters[T]> : any;
  dispatch(actionType: AppActionTypes, payload?: any): Promise<any>;
  commit(mutationType: AppMutationTypes, payload?: any): void;
  state: IAppState;
}

interface PHDStoreInterface {
  getters<T extends PHDGetterTypes>(getterType: T): T extends keyof PHDGetters ? ReturnType<PHDGetters[T]> : any;
  dispatch(actionType: PHDActionTypes, payload?: any): Promise<any>;
  commit(mutationType: PHDMutationTypes, payload?: any): void;
  state: IPHDState;
}

interface ASIAIRStoreInterface {
  getters<T extends ASIAIRGetterTypes>(getterType: T): T extends keyof ASIAIRGetters ? ReturnType<ASIAIRGetters[T]> : any;
  dispatch(actionType: ASIAIRActionTypes, payload?: any): Promise<any>;
  commit(mutationType: ASIAIRMutationTypes, payload?: any): void;
  state: IASIAIRState;
}

interface EquipmentStoreInterface {
  // Attempt to use ReturnType<Getters[K]> - this would be ideal but causes TypeScript errors
  getters<T extends EquipmentGetterTypes>(getterType: T): T extends keyof EquipmentGetters ? ReturnType<EquipmentGetters[T]> : any;
  dispatch(actionType: EquipmentActionTypes, payload?: any): Promise<any>;
  commit(mutationType: EquipmentMutationTypes, payload?: any): void;
  state: IEquipmentState;
}

export function useAppStore(): AppStoreInterface {
  const store = vuexUseStore(rootStoreKey);
  return rootStoreToNamespacedStore<AppActionTypes, AppActions, AppMutationTypes, AppMutations, AppGetterTypes, AppGetters, IAppState>('app', store);
}

export function usePHDStore(): PHDStoreInterface {
  const store = vuexUseStore(rootStoreKey);
  return rootStoreToNamespacedStore<PHDActionTypes, PHDActions, PHDMutationTypes, PHDMutations, PHDGetterTypes, PHDGetters, IPHDState>('phd', store);
}

export function useASIAIRStore(): ASIAIRStoreInterface {
  const store = vuexUseStore(rootStoreKey);
  return rootStoreToNamespacedStore<ASIAIRActionTypes, ASIAIRActions, ASIAIRMutationTypes, ASIAIRMutations, ASIAIRGetterTypes, ASIAIRGetters, IASIAIRState>('asiair', store);
}

export function useEquipmentStore(): EquipmentStoreInterface {
  const store = vuexUseStore(rootStoreKey);
  return rootStoreToNamespacedStore<EquipmentActionTypes, EquipmentActions, EquipmentMutationTypes, EquipmentMutations, EquipmentGetterTypes, EquipmentGetters, IEquipmentState>('equipment', store);
}
