import { getItem, setItem } from "@/utilities/LocalStorageUtilities";

export interface IAppState  {
  filesUploaded: boolean | null;
}

class AppState implements IAppState {
    constructor() {
        this.filesUploaded = false;
    }

    public get filesUploaded(): boolean {
        return getItem<boolean>('AppState.filesUploaded')!;
    }

    public set filesUploaded(value: boolean) {
        setItem('AppState.filesUploaded', value);
    }
}

export const appState = new AppState();
