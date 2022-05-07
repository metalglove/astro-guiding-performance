import { MutationTree } from 'vuex';
import { IAppState } from './App.state';

export enum AppMutationTypes {
  SET_FILES_UPLOADED = 'SET_FILES_UPLOADED'
}

export interface AppMutations {
  [AppMutationTypes.SET_FILES_UPLOADED](state: IAppState, filesUploaded: boolean | null): void;
}

export const appMutations: MutationTree<IAppState> & AppMutations = {
  [AppMutationTypes.SET_FILES_UPLOADED](state: IAppState, filesUploaded: boolean | null): void {
    state.filesUploaded = filesUploaded;
  },
}
