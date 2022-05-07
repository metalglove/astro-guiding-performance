import { computed, InjectionKey } from 'vue';
import { CommitOptions, createStore, DispatchOptions, Store, mapGetters } from 'vuex';
import { useStore as vuexUseStore } from 'vuex';
import { IAppState, AppStore, appStore } from './modules/App';
import { AppActions, AppActionTypes } from './modules/App/App.actions';
import { AppGetters, AppGetterTypes } from './modules/App/App.getters';
import { AppMutations, AppMutationTypes } from './modules/App/App.mutations';
// import { IASIAIRState, ASIAIRStore, asiairStore } from './modules/ASIAIR';
// import { IPHDState, PHDStore, phdStore } from './modules/PHD';

export interface RootState {
  app: IAppState;
  // phd: IPHDState;
  // asiair: IASIAIRState;
}

export type RootStore =
  AppStore<Pick<RootState, 'app'>>;// &
  // ASIAIRStore<Pick<RootState, 'asiair'>> &
  // PHDStore<Pick<RootState, 'phd'>>;

export const rootStore = createStore({
  modules: {
    app: appStore,
    // phd: phdStore,
    // asiair: asiairStore,
  }
});

export const rootStoreKey: InjectionKey<Store<RootState>> = Symbol()

export function useStore() {
  const store = vuexUseStore(rootStoreKey);
  return store;
}

function rootStoreToNamespacedStore<ActionTypes, Actions extends { [key: string]: any }, MutationsTypes, Mutations extends { [key: string]: any }, GetterTypes, Getters extends { [key: string]: any }, StateType>(namespace: string, store: Store<any>) {
  return {
    getters<K extends keyof Getters>(getterType: GetterTypes): ReturnType<Getters[K]> {
      return store.getters[`${namespace}/${getterType}`];
    },
    dispatch<K extends keyof Actions>(payloadWithType: ActionTypes, payload: Parameters<Actions[K]>[1], options?: DispatchOptions): ReturnType<Actions[K]> {
      return store.dispatch(`${namespace}/${payloadWithType}`, payload, options) as ReturnType<Actions[K]>;
    },
    commit<K extends keyof Mutations>(payloadWithType: MutationsTypes, payload: Parameters<Mutations[K]>[1], options?: CommitOptions): void {
      return store.commit(`${namespace}/${payloadWithType}`, payload, options)
    },
    state: store.state[namespace] as StateType
  };
}

export function useAppStore() {
  const store = vuexUseStore(rootStoreKey);
  return rootStoreToNamespacedStore<AppActionTypes, AppActions, AppMutationTypes, AppMutations, AppGetterTypes, AppGetters, IAppState>('app', store);
}
