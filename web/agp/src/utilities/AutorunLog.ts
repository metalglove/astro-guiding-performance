interface Position {
  RA: string;
  DEC: string;
}

interface ExposureEvent {
  integrationTime: string;
  image: number;
  datetime: Date;
  type: string;
}

interface AutoCenterEvent {
  startTime: Date;
  attempt: number;
  endTime: Date;
  targetPosition: Position;
  solvedPosition: Position;
  solvedAngle: number;
  detectedStars: number;
  isCentered: boolean;
  distanceFromCenter: string;
}

interface VCurveMeasurement {
  starSize: number;
  eafPosition: number;
  datetime: Date;
}

interface AutoFocusEvent {
  startTime: Date;
  endTime: Date;
  temperature: number;
  vCurveMeasurements: VCurveMeasurement[];
  focusPosition: number;
}

interface DitherEvent {
  startTime: Date;
  endTime: Date;
  timedOut: boolean;
}

class Autorun {
  private _startTime: Date;
  private _endTime: Date;
  private _plan: string;
  private _exposureEvents: ExposureEvent[];
  private _autoCenterEvents: AutoCenterEvent[];
  private _autoFocusEvents: AutoFocusEvent[];
  private _ditherEvents: DitherEvent[];

  public get autoCenterEvents(): AutoCenterEvent[] {
    return this._autoCenterEvents;
  }

  public get autoFocusEvents(): AutoFocusEvent[] {
    return this._autoFocusEvents;
  }

  public get exposureEvents(): ExposureEvent[] {
    return this._exposureEvents;
  }

  public get ditherEvents(): DitherEvent[] {
    return this._ditherEvents;
  }

  public get startTime(): Date {
    return this._startTime;
  }

  public get endTime(): Date {
    return this._endTime;
  }

  public set endTime(value: Date) {
    this._endTime = value;
  }

  public get plan(): string {
    return this._plan;
  }

  constructor(plan: string, startTime: Date) {
    this._startTime = startTime;
    this._plan = plan;
    this._endTime = startTime; // NOTE: same as start time for now
    this._exposureEvents = [];
    this._autoCenterEvents = [];
    this._autoFocusEvents = [];
    this._ditherEvents = [];
  }

  public addExposureEvent(exposureEvent: ExposureEvent): void {
    this._exposureEvents = this._exposureEvents.concat(exposureEvent);
  }

  public addAutoCenterEvent(autoCenterEvent: AutoCenterEvent): void {
    this._autoCenterEvents = this._autoCenterEvents.concat(autoCenterEvent);
  }

  public addAutoFocusEvent(autoFocusEvent: AutoFocusEvent): void {
    this._autoFocusEvents = this._autoFocusEvents.concat(autoFocusEvent);
  }

  public addDitherEvent(ditherEvent: DitherEvent): void {
    this._ditherEvents = this._ditherEvents.concat(ditherEvent);
  }
}

class AutorunLog {
  private _autoruns: Autorun[] = [];
  private _datetime: Date;

  public get autoruns(): Autorun[] {
    return this._autoruns;
  }

  public get datetime(): Date {
    return this._datetime;
  }

  constructor(datetime: Date) {
    this._datetime = datetime;
  }

  public addAutorun(autorun: Autorun): void {
    this._autoruns = this.autoruns.concat(autorun);
  }
}

export { Autorun, AutorunLog, AutoCenterEvent, ExposureEvent, AutoFocusEvent, VCurveMeasurement, DitherEvent };
