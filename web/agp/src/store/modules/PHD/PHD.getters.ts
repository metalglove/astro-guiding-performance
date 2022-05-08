import { GetterTree } from 'vuex';
import { IPHDState } from './PHD.state';
import { RootState } from '@/store';
import { PHDLog } from './PHD.types';

export enum PHDGetterTypes {
  GET_PHD_LOG = 'GET_PHD_LOG'
}

export interface PHDGetters {
  [PHDGetterTypes.GET_PHD_LOG](state: IPHDState): PHDLog;
}

export const phdGetters: GetterTree<IPHDState, RootState> & PHDGetters = {
  [PHDGetterTypes.GET_PHD_LOG](state: IPHDState): PHDLog {
    return state.phdLog;
  }
}
