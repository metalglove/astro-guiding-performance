import { getItem, setItem } from '@/utilities/LocalStorageUtilities';
import { PHDLog } from './PHD.types';

export interface IPHDState  {
  phdLog: PHDLog;
}

class PHDState implements IPHDState {
  public get phdLog(): PHDLog {
    return getItem<PHDLog>('PHDState.phdLog')!;
  }

  public set phdLog(value: PHDLog) {
    setItem('PHDState.phdLog', value);
  }
}

export const phdState = new PHDState();
