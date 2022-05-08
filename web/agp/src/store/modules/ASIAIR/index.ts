import { Store, CommitOptions, DispatchOptions, Module } from 'vuex';
import { RootState } from '@/store';
import { ASIAIRActions, asiairActions } from './ASIAIR.actions';
import { ASIAIRGetters, asiairGetters } from './ASIAIR.getters';
import { ASIAIRMutations, asiairMutations } from './ASIAIR.mutations';
import { IASIAIRState as State, asiairState } from './ASIAIR.state';

export type IASIAIRState = State;

export type ASIAIRModule = {
    namespaced?: boolean;
    state?: IASIAIRState;
    mutations?: ASIAIRMutations;
    actions?: ASIAIRActions;
    getters?: ASIAIRGetters;
};

export type ASIAIRStore<S = IASIAIRState> = Omit<Store<S>, 'getters' | 'commit' | 'dispatch'>
    & {
        commit<K extends keyof ASIAIRMutations, P extends Parameters<ASIAIRMutations[K]>[1]>(
            key: K,
            payload: P,
            options?: CommitOptions
        ): ReturnType<ASIAIRMutations[K]>;
    } & {
        dispatch<K extends keyof ASIAIRActions, P extends Parameters<ASIAIRActions[K]>[1]>(
            key: K,
            payload: P,
            options?: DispatchOptions
        ): ReturnType<ASIAIRActions[K]>;
    } & {
        getters: {
            [K in keyof ASIAIRGetters]: ReturnType<ASIAIRGetters[K]>
        };
    };

export const asiairStore: Module<IASIAIRState, RootState> & ASIAIRModule = {
    namespaced: true,
    state: asiairState,
    mutations: asiairMutations,
    actions: asiairActions,
    getters: asiairGetters
};
