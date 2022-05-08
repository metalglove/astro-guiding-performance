interface GuidingFrame {
  frame: number;
  timeInMilliseconds: number;
  datetime: Date;
  mount: string; // MOUNT or DROP?
  dx: number; // camera axes
  dy: number; // camera axes
  RARawDistance: number; // mount axes
  DECRawDistance: number; // mount axes
  RAGuideDistance: number;
  DECGuideDistance: number;
  RADuration: number;
  RADirection: string;
  DECDuration: number;
  DECDirection: string;
  XStep: number;
  YStep: number;
  StarMass: number;
  SNR: number;
  ErrorCode: string;
}

interface CalibrationStep {
  direction: string;
  step: number;
  dx: number;
  dy: number;
  x: number;
  y: number;
  distance: number;
}

interface CalibrationSession {
  dateTime: Date;
  camera: string;
  equipmentProfile: string;
  exposure: number;
  pixelScale: number;
  binning: number;
  focalLength: number;
  mount: string;
  calibrationStep: number;
  assumeOrthogonalAxes: string;
  calibrationSteps: CalibrationStep[];
  degrees: number;
  hourAngle: number;
  pierSide: string;
  rotatorPosition: string;
  lockPositionX: number;
  lockPositionY: number;
  starPositionX: number;
  starPositionY: number;
  halfFluxDiameterInPixels: number;
  westCalibrationAngle: number;
  westCalibrationRate: number;
  westCalibrationParity: string;
  northCalibrationAngle: number;
  northCalibrationRate: number;
  northCalibrationParity: string;
}

// For more detail on the log:
// https://openphdguiding.org/man-dev/Advanced_settings.htm
interface GuidingSession {
  guidingFrames: GuidingFrame[];
  startTime: Date;
  endTime: Date;
  dither: string;
  ditherScale: number;
  imageNoiseReduction: string;
  pixelScale: number;
  binning: number;
  focalLength: number;
  searchRegionInPixels: number;
  starMassTolerancePercentage: number;
  equipmentProfile: string;
  camera: string;
  cameraGain: number;
  cameraWidth: number;
  cameraHeight: number;
  cameraPixelSize: number;
  exposureTime: number;
  mount: string;
  xAngle: number;
  xRate: number;
  yAngle: number;
  yRate: number;
  parity: string;
  xGuidingAlgorithm: string;
  yGuidingAlgorithm: string;
  backlashCompensation: string;
  calibrationStep: string;
  maxRADuration: number;
  maxDECDuration: number;
  DECGuideMode: string;
  RAGuideSpeed: string;
  DECGuideSpeed: string;
  degrees: number;
  hourAngle: number;
  pierSide: string;
  rotatorPosition: string;
  lockPositionX: number;
  lockPositionY: number;
  starPositionX: number;
  starPositionY: number;
  halfFluxDiameterInPixels: number;
}

interface PHDLog {
  datetime: Date;
  phdLogVersion: string;
  guidingSessions: GuidingSession[];
  calibrationSessions: CalibrationSession[];
}

export { PHDLog, GuidingSession, GuidingFrame, CalibrationSession, CalibrationStep };
