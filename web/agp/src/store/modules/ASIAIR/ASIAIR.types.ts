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

interface Autorun {
  startTime: Date;
  endTime: Date;
  plan: string;
  exposureEvents: ExposureEvent[];
  autoCenterEvents: AutoCenterEvent[];
  autoFocusEvents: AutoFocusEvent[];
  ditherEvents: DitherEvent[];
}

interface ASIAIRLog {
  autoruns: Autorun[];
  datetime: Date;
}

export { Autorun, ASIAIRLog, AutoCenterEvent, ExposureEvent, AutoFocusEvent, VCurveMeasurement, DitherEvent };
