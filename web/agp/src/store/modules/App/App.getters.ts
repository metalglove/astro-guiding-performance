import { GetterTree } from 'vuex';
import { IAppState } from './App.state';
import { RootState } from '@/store';

export enum AppGetterTypes {
  GET_FILES_UPLOADED = 'GET_FILES_UPLOADED'
}

export interface AppGetters {
  [AppGetterTypes.GET_FILES_UPLOADED](state: IAppState): boolean | null;
}

export const appGetters: GetterTree<IAppState, RootState> & AppGetters = {
  [AppGetterTypes.GET_FILES_UPLOADED](state: IAppState): boolean | null {
    return state.filesUploaded;
  }
}
