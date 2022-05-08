import { MutationTree } from 'vuex';
import { IASIAIRState } from './ASIAIR.state';
import { ASIAIRLog } from './ASIAIR.types';

export enum ASIAIRMutationTypes {
  SET_ASIAIR_LOG = 'SET_ASIAIR_LOG'
}

export interface ASIAIRMutations {
  [ASIAIRMutationTypes.SET_ASIAIR_LOG](state: IASIAIRState, asiairLog: ASIAIRLog): void;
}

export const asiairMutations: MutationTree<IASIAIRState> & ASIAIRMutations = {
  [ASIAIRMutationTypes.SET_ASIAIR_LOG](state: IASIAIRState, asiairLog: ASIAIRLog): void {
    state.asiairLog = asiairLog;
  },
}
