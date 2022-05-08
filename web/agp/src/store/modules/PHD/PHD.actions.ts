import { ActionTree, ActionContext } from 'vuex';
import { IPHDState } from './PHD.state';
import { PHDMutations, PHDMutationTypes } from './PHD.mutations';
import { RootState } from '@/store';
import { PHDLog } from './PHD.types';

export enum PHDActionTypes {
    SET_PHD_LOG = 'SET_PHD_LOG'
}

type AugmentedPHDActionContext = {
    commit<K extends keyof PHDMutations>(
        key: K,
        payload: Parameters<PHDMutations[K]>[1]
    ): ReturnType<PHDMutations[K]>
} & Omit<ActionContext<IPHDState, RootState>, 'commit'>;

export interface PHDActions {
    [PHDActionTypes.SET_PHD_LOG](
        { commit }: AugmentedPHDActionContext,
        payload: PHDLog
    ): void;
}

export const phdActions: ActionTree<IPHDState, RootState> & PHDActions = {
    [PHDActionTypes.SET_PHD_LOG](
        { commit }: AugmentedPHDActionContext,
        payload: PHDLog
    ): void {
        commit(PHDMutationTypes.SET_PHD_LOG, payload);
    },
};
