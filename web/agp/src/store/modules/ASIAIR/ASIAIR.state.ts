import { getItem, setItem } from '@/utilities/LocalStorageUtilities';
import { ASIAIRLog } from './ASIAIR.types';

export interface IASIAIRState  {
  asiairLog: ASIAIRLog;
}

class ASIAIRState implements IASIAIRState {
  public get asiairLog(): ASIAIRLog {
    return getItem<ASIAIRLog>('ASIAIRState.asiairLog')!;
  }

  public set asiairLog(value: ASIAIRLog) {
    setItem('ASIAIRState.asiairLog', value);
  }
}

export const asiairState = new ASIAIRState();
