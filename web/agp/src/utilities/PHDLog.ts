interface GuidingFrame {
  frame: number;
  timeInMilliseconds: number;
  datetime: Date; // based on previous date + time
  mount: string; // MOUNT or DROP?
  dx: number;
  dy: number;
  RARawDistance: number;
  DECRawDistance: number;
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

// For more detail on the log:
// https://openphdguiding.org/man-dev/Advanced_settings.htm
class GuidingSession {
  private _guidingFrames: GuidingFrame[];
  public get guidingFrames(): GuidingFrame[] {
    return this._guidingFrames;
  }

  private _startTime: Date;
  public get startTime(): Date {
    return this._startTime;
  }

  private _dither: string;
  public get dither(): string {
    return this._dither;
  }

  private _ditherScale: number;
  public get ditherScale(): number {
    return this._ditherScale;
  }

  private _imageNoiseReduction: string;
  public get imageNoiseReduction(): string {
    return this._imageNoiseReduction;
  }

  private _pixelScale: number;
  public get pixelScale(): number {
    return this._pixelScale;
  }

  private _binning: number;
  public get binning(): number {
    return this._binning;
  }

  private _focalLength: number;
  public get focalLength(): number {
    return this._focalLength;
  }

  private _searchRegionInPixels: number;
  public get searchRegionInPixels(): number {
    return this._searchRegionInPixels;
  }

  private _starMassTolerancePercentage: number;
  public get starMassTolerancePercentage(): number {
    return this._starMassTolerancePercentage;
  }

  private _equipmentProfile: string;
  public get equipmentProfile(): string {
    return this._equipmentProfile;
  }

  private _camera: string;
  public get camera(): string {
    return this._camera;
  }

  private _cameraGain: number;
  public get cameraGain(): number {
    return this._cameraGain;
  }

  private _cameraWidth: number;
  public get cameraWidth(): number {
    return this._cameraWidth;
  }

  private _cameraHeight: number;
  public get cameraHeight(): number {
    return this._cameraHeight;
  }

  private _cameraPixelSize: number;
  public get cameraPixelSize(): number {
    return this._cameraPixelSize;
  }

  private _exposureTime: number;
  public get exposureTime(): number {
    return this._exposureTime;
  }

  private _mount: string;
  public get mount(): string {
    return this._mount;
  }

  private _xAngle: number;
  public get xAngle(): number {
    return this._xAngle;
  }

  private _xRate: number;
  public get xRate(): number {
    return this._xRate;
  }

  private _yAngle: number;
  public get yAngle(): number {
    return this._yAngle;
  }

  private _yRate: number;
  public get yRate(): number {
    return this._yRate;
  }

  private _parity: string;
  public get parity(): string {
    return this._parity;
  }

  private _xGuidingAlgorithm: string;
  public get xGuidingAlgorithm(): string {
    return this._xGuidingAlgorithm;
  }

  private _yGuidingAlgorithm: string;
  public get yGuidingAlgorithm(): string {
    return this._yGuidingAlgorithm;
  }

  private _backlashCompensation: string;
  public get backlashCompensation(): string {
    return this._backlashCompensation;
  }

  private _calibrationStep: string;
  public get calibrationStep(): string {
    return this._calibrationStep;
  }

  private _maxRADuration: number;
  public get maxRADuration(): number {
    return this._maxRADuration;
  }

  private _maxDECDuration: number;
  public get maxDECDuration(): number {
    return this._maxDECDuration;
  }

  private _DECGuideMode: string;
  public get DECGuideMode(): string {
    return this._DECGuideMode;
  }

  private _RAGuideSpeed: string;
  public get RAGuideSpeed(): string {
    return this._RAGuideSpeed;
  }

  private _DECGuideSpeed: string;
  public get DECGuideSpeed(): string {
    return this._DECGuideSpeed;
  }

  private _degrees: number;
  public get degrees(): number {
    return this._degrees;
  }

  private _hourAngle: number;
  public get hourAngle(): number {
    return this._hourAngle;
  }

  private _pierSide: string;
  public get pierSide(): string {
    return this._pierSide;
  }

  private _rotatorPosition: string;
  public get rotatorPosition(): string {
    return this._rotatorPosition;
  }

  private _lockPositionX: number;
  public get lockPositionX(): number {
    return this._lockPositionX;
  }

  private _lockPositionY: number;
  public get lockPositionY(): number {
    return this._lockPositionY;
  }

  private _starPositionX: number;
  public get starPositionX(): number {
    return this._starPositionX;
  }

  private _starPositionY: number;
  public get starPositionY(): number {
    return this._starPositionY;
  }

  private _halfFluxDiameterInPixels: number;
  public get halfFluxDiameterInPixels(): number {
    return this._halfFluxDiameterInPixels;
  }

  constructor(
    startTime: Date, dither: string, ditherScale: number, imageNoiseReduction: string,
    pixelScale: number, binning: number, focalLength: number,
    searchRegionInPixels: number, starMassTolerancePercentage: number,
    equipmentProfile: string,
    camera: string, cameraGain: number, cameraWidth: number, cameraHeight: number, cameraPixelSize: number,
    exposureTime: number,
    mount: string, xAngle: number, xRate: number, yAngle: number, yRate: number, parity: string,
    xGuidingAlgorithm: string,
    yGuidingAlgorithm: string,
    backlashCompensation: string,
    calibrationStep: string, maxRADuration: number, maxDECDuration: number, DECGuideMode: string,
    RAGuideSpeed: string, DECGuideSpeed: string,
    degrees: number, hourAngle: number, pierSide: string, rotatorPosition: string,
    lockPositionX: number, lockPositionY: number, starPositionX: number, starPositionY: number, halfFluxDiameterInPixels: number,
    ) {
    this._guidingFrames = [];
    this._startTime = startTime;
    this._dither = dither;
    this._ditherScale = ditherScale;
    this._imageNoiseReduction = imageNoiseReduction;
    this._pixelScale = pixelScale;
    this._binning = binning;
    this._focalLength = focalLength;
    this._searchRegionInPixels = searchRegionInPixels;
    this._starMassTolerancePercentage = starMassTolerancePercentage;
    this._equipmentProfile = equipmentProfile;
    this._camera = camera;
    this._cameraGain = cameraGain;
    this._cameraWidth = cameraWidth;
    this._cameraHeight = cameraHeight;
    this._cameraPixelSize = cameraPixelSize;
    this._exposureTime = exposureTime;
    this._mount = mount;
    this._xAngle = xAngle;
    this._xRate = xRate;
    this._yAngle = yAngle;
    this._yRate = yRate;
    this._parity = parity;
    this._xGuidingAlgorithm = xGuidingAlgorithm;
    this._yGuidingAlgorithm = yGuidingAlgorithm;
    this._backlashCompensation = backlashCompensation;
    this._calibrationStep = calibrationStep;
    this._maxRADuration = maxRADuration;
    this._maxDECDuration = maxDECDuration;
    this._DECGuideMode = DECGuideMode;
    this._RAGuideSpeed = RAGuideSpeed;
    this._DECGuideSpeed = DECGuideSpeed;
    this._degrees = degrees;
    this._hourAngle = hourAngle;
    this._pierSide = pierSide;
    this._rotatorPosition = rotatorPosition;
    this._lockPositionX = lockPositionX;
    this._lockPositionY = lockPositionY;
    this._starPositionX = starPositionX;
    this._starPositionY = starPositionY;
    this._halfFluxDiameterInPixels = halfFluxDiameterInPixels;
  }

  public addGuidingFrame(guidingFrame: GuidingFrame): void {
    this._guidingFrames = this._guidingFrames.concat(guidingFrame);
  }
}

class PHDLog {
  private _datetime: Date;
  public get datetime(): Date {
    return this._datetime;
  }

  private _phdLogVersion: string;
  public get phdLogVersion(): string {
    return this._phdLogVersion;
  }

  private _guidingSessions: GuidingSession[];
  public get guidingSessions(): GuidingSession[] {
    return this._guidingSessions;
  }

  constructor(phdLogVersion: string, datetime: Date) {
    this._datetime = datetime;
    this._phdLogVersion = phdLogVersion;
    this._guidingSessions = [];
  }

  public addGuidingSession(guidingSession: GuidingSession) {
    this._guidingSessions = this._guidingSessions.concat(guidingSession);
  }
}

export { PHDLog, GuidingSession, GuidingFrame };
