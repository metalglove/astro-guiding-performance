import { Store, CommitOptions, DispatchOptions, Module } from 'vuex';
import { RootState } from '@/store';
import { PHDActions, phdActions } from './PHD.actions';
import { PHDGetters, phdGetters } from './PHD.getters';
import { PHDMutations, phdMutations } from './PHD.mutations';
import { IPHDState as State, phdState } from './PHD.state';

export type IPHDState = State;

export type PHDModule = {
    namespaced?: boolean;
    state?: IPHDState;
    mutations?: PHDMutations;
    actions?: PHDActions;
    getters?: PHDGetters;
};

export type PHDStore<S = IPHDState> = Omit<Store<S>, 'getters' | 'commit' | 'dispatch'>
    & {
        commit<K extends keyof PHDMutations, P extends Parameters<PHDMutations[K]>[1]>(
            key: K,
            payload: P,
            options?: CommitOptions
        ): ReturnType<PHDMutations[K]>;
    } & {
        dispatch<K extends keyof PHDActions, P extends Parameters<PHDActions[K]>[1]>(
            key: K,
            payload: P,
            options?: DispatchOptions
        ): ReturnType<PHDActions[K]>;
    } & {
        getters: {
            [K in keyof PHDGetters]: ReturnType<PHDGetters[K]>
        };
    };

export const phdStore: Module<IPHDState, RootState> & PHDModule = {
    namespaced: true,
    state: phdState,
    mutations: phdMutations,
    actions: phdActions,
    getters: phdGetters
};
