import { ActionTree, ActionContext } from 'vuex';
import { IAppState } from './App.state';
import { AppMutations, AppMutationTypes } from './App.mutations';
import { RootState } from '@/store';

export enum AppActionTypes {
    SET_FILES_UPLOADED = 'SET_FILES_UPLOADED'
}

type AugmentedAppActionContext = {
    commit<K extends keyof AppMutations>(
        key: K,
        payload: Parameters<AppMutations[K]>[1]
    ): ReturnType<AppMutations[K]>
} & Omit<ActionContext<IAppState, RootState>, 'commit'>;

export interface AppActions {
    [AppActionTypes.SET_FILES_UPLOADED](
        { commit }: AugmentedAppActionContext,
        payload: boolean
    ): void;
}

export const appActions: ActionTree<IAppState, RootState> & AppActions = {
    [AppActionTypes.SET_FILES_UPLOADED](
        { commit }: AugmentedAppActionContext,
        payload: boolean
    ): void {
        commit(AppMutationTypes.SET_FILES_UPLOADED, payload);
    },
};
