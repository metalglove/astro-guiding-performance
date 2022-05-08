import { ActionTree, ActionContext } from 'vuex';
import { IASIAIRState } from './ASIAIR.state';
import { ASIAIRMutations, ASIAIRMutationTypes } from './ASIAIR.mutations';
import { RootState } from '@/store';
import { ASIAIRLog } from './ASIAIR.types';

export enum ASIAIRActionTypes {
    SET_ASIAIR_LOG = 'SET_ASIAIR_LOG'
}

type AugmentedASIAIRActionContext = {
    commit<K extends keyof ASIAIRMutations>(
        key: K,
        payload: Parameters<ASIAIRMutations[K]>[1]
    ): ReturnType<ASIAIRMutations[K]>
} & Omit<ActionContext<IASIAIRState, RootState>, 'commit'>;

export interface ASIAIRActions {
    [ASIAIRActionTypes.SET_ASIAIR_LOG](
        { commit }: AugmentedASIAIRActionContext,
        payload: ASIAIRLog
    ): void;
}

export const asiairActions: ActionTree<IASIAIRState, RootState> & ASIAIRActions = {
    [ASIAIRActionTypes.SET_ASIAIR_LOG](
        { commit }: AugmentedASIAIRActionContext,
        payload: ASIAIRLog
    ): void {
        commit(ASIAIRMutationTypes.SET_ASIAIR_LOG, payload);
    },
};
