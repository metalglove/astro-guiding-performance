import { GetterTree } from 'vuex';
import { IASIAIRState } from './ASIAIR.state';
import { RootState } from '@/store';
import { ASIAIRLog } from './ASIAIR.types';

export enum ASIAIRGetterTypes {
  GET_ASIAIR_LOG = 'GET_ASIAIR_LOG'
}

export interface ASIAIRGetters {
  [ASIAIRGetterTypes.GET_ASIAIR_LOG](state: IASIAIRState): ASIAIRLog;
}

export const asiairGetters: GetterTree<IASIAIRState, RootState> & ASIAIRGetters = {
  [ASIAIRGetterTypes.GET_ASIAIR_LOG](state: IASIAIRState): ASIAIRLog {
    return state.asiairLog;
  }
}
