import { MutationTree } from 'vuex';
import { IPHDState } from './PHD.state';
import { PHDLog } from './PHD.types';

export enum PHDMutationTypes {
  SET_PHD_LOG = 'SET_PHD_LOG'
}

export interface PHDMutations {
  [PHDMutationTypes.SET_PHD_LOG](state: IPHDState, phdLog: PHDLog): void;
}

export const phdMutations: MutationTree<IPHDState> & PHDMutations = {
  [PHDMutationTypes.SET_PHD_LOG](state: IPHDState, phdLog: PHDLog): void {
    state.phdLog = phdLog;
  },
}
