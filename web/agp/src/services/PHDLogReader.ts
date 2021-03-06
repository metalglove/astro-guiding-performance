import { PHDLog, GuidingSession, GuidingFrame, CalibrationSession, CalibrationStep } from '@/store/modules/PHD/PHD.types';

export default class PHDLogReader {
  public parseText(text: string): PHDLog {
    if (!text.startsWith('PHD2')) {
      throw new Error('Invalid PHD2 log text file.');
    }

    const lines: string[] = text.split('\n');
    let index = -1;
    let currentLine = '';

    function updateCurrentLine(): boolean {
      index += 1;
      if (index == lines.length) {
        return false;
      }
      const line: string = lines[index];
      if (line === '' || line.startsWith('INFO:')) {
        return updateCurrentLine();
      } else {
        currentLine = line;
        return true;
      }
    }

    function parsePixelScaleLine() {
      const re = /Pixel scale = (.*) arc-sec\/px, Binning = (.*), Focal length = (.*) mm/g;
      const match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Pixel line.');
      }
      const pixelScale: number = parseFloat(match[1]);
      const binning: number = parseInt(match[2]);
      const focalLength: number = parseInt(match[3]);
      updateCurrentLine();
      return { pixelScale, binning, focalLength };
    }

    function parseEquipmentProfileLine(): string {
      const re = /Equipment Profile = (.*)/g;
      const match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Equipment Profile line.');
      }
      const equipmentProfile: string = match[1];
      updateCurrentLine();
      return equipmentProfile;
    }

    function parseExposureLine(): number {
      const re = /Exposure = (.*) (?:.*)s/g;
      const match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Exposure line.');
      }
      const exposureTime: number = parseFloat(match[1]);
      updateCurrentLine();
      return exposureTime;
    }

    function parseDecLine() {
      // Dec = 69.0 deg, Hour angle = -1.78 hr, Pier side = West, Rotator pos = N/A
      const re = /Dec = (.*) deg, Hour angle = (.*) hr, Pier side = (.*), Rotator pos = (.*)/g;
      const match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Dec line.');
      }
      const degrees: number = parseFloat(match[1]);
      const hourAngle: number = parseFloat(match[2]);
      const pierSide: string = match[3];
      const rotatorPosition: string = match[4];
      updateCurrentLine();
      return { degrees, hourAngle, pierSide, rotatorPosition };
    }

    function parseLockLine() {
      const re = /Lock position = (.*), (.*), Star position = (.*), (.*), HFD = (.*) px/g;
      const match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Lock position line.');
      }
      const lockPositionX: number = parseFloat(match[1]);
      const lockPositionY: number = parseFloat(match[2]);
      const starPositionX: number = parseFloat(match[3]);
      const starPositionY: number = parseFloat(match[4]);
      const halfFluxDiameterInPixels: number = parseFloat(match[5]);
      updateCurrentLine();
      return { lockPositionX, lockPositionY, starPositionX, starPositionY, halfFluxDiameterInPixels };
    }

    function startGuidingSession(): void {
      // create guiding session from the next 14 lines

      // 1. read start datetime
      // Guiding Begins at 2022-03-18 21:02:59
      let re = /Guiding Begins at (.*)/g;
      let match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Guiding Begins line.');
      }
      const startTime: Date = new Date(match[1]);
      updateCurrentLine();

      // 2. dither, dither scale, image noise reduction
      // Dither = both axes, Dither scale = 1.000, Image noise reduction = none, Guide-frame time lapse = 0, Server enabled
      re = /Dither = (.*), Dither scale = (.*), Image noise reduction = (.*), (?:.*), (?:.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Dither line.');
      }
      const dither: string = match[1];
      const ditherScale: number = parseFloat(match[2]);
      const imageNoiseReduction: string = match[3];
      updateCurrentLine();

      // 3. pixel scale, binning, focal length
      // Pixel scale = 6.04 arc-sec/px, Binning = 1, Focal length = 128 mm

      const { pixelScale, binning, focalLength } = parsePixelScaleLine();

      // 4. search region, star mass tolerance
      // Search region = 50 px, Star mass tolerance = 50.0%
      re = /Search region = (.*) px, Star mass tolerance = (.*)%/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Search region line.');
      }
      const searchRegionInPixels: number = parseInt(match[1]);
      const starMassTolerancePercentage: number = parseInt(match[2]);
      updateCurrentLine();

      // 5. Equipment profile?
      // Equipment Profile =
      const equipmentProfile: string = parseEquipmentProfileLine();

      // 6. Camera, gain, resolution, pixel size
      // Camera = ZWO ASI224MC, gain = 300, full size = 1304 x 976, no dark, no defect map, pixel size = 3.8 um
      re = /Camera = (.*), gain = (.*), full size = (.*) x (.*), (?:.*), (?:.*), pixel size = (.*) um/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Camera line.');
      }
      const camera: string = match[1];
      const cameraGain: number = parseInt(match[2]);
      const cameraWidth: number = parseInt(match[3]);
      const cameraHeight: number = parseInt(match[4]);
      const cameraPixelSize: number = parseFloat(match[5]);
      updateCurrentLine();

      // 7. Exposure time
      // Exposure = 1000 ms
      const exposureTime: number = parseExposureLine();

      // 8. Mount, xAngle, xRate, yAngle, yRate, parity
      // Mount = Celestron AVX/CGE/CGEM/CGX,  connected, guiding enabled, xAngle = 59.7, xRate = 0.420, yAngle = 148.2, yRate = 1.190, parity = +/+,
      re = /Mount = (.*),  (?:.*), (?:.*), xAngle = (.*), xRate = (.*), yAngle = (.*), yRate = (.*), parity = (.*),/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Mount line.');
      }
      const mount: string = match[1];
      const xAngle: number = parseFloat(match[2]);
      const xRate: number = parseFloat(match[3]);
      const yAngle: number = parseFloat(match[4]);
      const yRate: number = parseFloat(match[5]);
      const parity: string = match[6];
      updateCurrentLine();

      // 9. guiding algorithm X,
      // X guide algorithm = Hysteresis, Hysteresis = 0.100, Aggression = 0.700, Minimum move = 0.100
      re = /X guide algorithm = (.*), (?:.*), (?:.*), (?:.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse X guide algorithm line.');
      }
      const xGuidingAlgorithm: string = match[1];
      updateCurrentLine();

      // 9. guiding algorithm Y
      // Y guide algorithm = Resist Switch, Minimum move = 0.100 Aggression = 100% FastSwitch = enabled
      re = /Y guide algorithm = (.*), (?:.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Y guide algorithm line.');
      }
      const yGuidingAlgorithm: string = match[1];
      updateCurrentLine();

      // 10. backlash compensation?, pulse?
      // Backlash comp = disabled, pulse = 0 ms
      re = /Backlash comp = (.*), pulse = (?:.*) (?:.*)s/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Backlash comp line.');
      }
      const backlashCompensation: string = match[1];
      updateCurrentLine();

      // 11. calibration step, max RA duration, max DEC duration, DEC guide mode,
      // Calibration step = phdlab_placeholder, Max RA duration = 1500, Max DEC duration = 1500, DEC guide mode = Auto
      re = /Calibration step = (.*), Max RA duration = (.*), Max DEC duration = (.*), DEC guide mode = (.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Calibration step line.');
      }
      const calibrationStep: string = match[1];
      const maxRADuration: number = parseInt(match[2]);
      const maxDECDuration: number = parseInt(match[3]);
      const DECGuideMode: string = match[4];
      updateCurrentLine();

      // 12. RA guide speed, DEC guide speed,
      // RA Guide Speed = Unknown, Dec Guide Speed = Unknown, Cal Dec = 34.4, Last Cal Issue = None, Timestamp = Unknown
      re = /RA Guide Speed = (.*), Dec Guide Speed = (.*), Cal Dec = (?:.*), Last Cal Issue = (?:.*), Timestamp = (?:.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse RA Guide Speed line.');
      }
      const RAGuideSpeed: string = match[1];
      const DECGuideSpeed: string = match[2];
      updateCurrentLine();

      // 13. DEC, hour angle, pier side, rotator pos,
      // Dec = 69.0 deg, Hour angle = -1.78 hr, Pier side = West, Rotator pos = N/A
      const { degrees, hourAngle, pierSide, rotatorPosition } = parseDecLine();

      // 14. Lock position, Star position, HFD
      // Lock position = 462.631, 298.537, Star position = 462.576, 298.547, HFD = 3.30 px
      const { lockPositionX, lockPositionY, starPositionX, starPositionY, halfFluxDiameterInPixels } = parseLockLine();

      currentGuidingSession = {
        startTime, dither, ditherScale, imageNoiseReduction,
        pixelScale, binning, focalLength,
        searchRegionInPixels, starMassTolerancePercentage,
        equipmentProfile,
        camera, cameraGain, cameraWidth, cameraHeight, cameraPixelSize,
        exposureTime,
        mount, xAngle, xRate, yAngle, yRate, parity,
        xGuidingAlgorithm,
        yGuidingAlgorithm,
        backlashCompensation,
        calibrationStep, maxRADuration, maxDECDuration, DECGuideMode,
        RAGuideSpeed, DECGuideSpeed,
        degrees, hourAngle, pierSide, rotatorPosition,
        lockPositionX, lockPositionY, starPositionX, starPositionY, halfFluxDiameterInPixels,
        guidingFrames: [],
        endTime: startTime // endTime is not yet known
      };
    }

    function endGuidingSession(): void {
      //add guiding session to phd log
      phdLog.guidingSessions.push(currentGuidingSession!);
      updateCurrentLine();
    }

    function parseCalibrationSession(): CalibrationSession {

      // 1. Calibration Begins at 2022-03-27 22:47:47
      let re = /Calibration Begins at (.*)/g;
      let match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Calibration Begins line.');
      }
      const startTime: Date = new Date(match[1]);
      updateCurrentLine();

      // 2. Equipment profile
      // Equipment Profile =
      const equipmentProfile: string = parseEquipmentProfileLine();

      // 3. Camera
      // Camera = ZWO ASI224MC
      re = /Camera = (.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Camera line.');
      }
      const camera: string = match[1];
      updateCurrentLine();

      // 4. Exposure
      // Exposure = 1000 ms
      const exposure: number = parseExposureLine();

      // 5. Pixel scale
      // Pixel scale = 6.04 arc-sec/px, Binning = 1, Focal length = 128 mm
      const { pixelScale, binning, focalLength } = parsePixelScaleLine();

      // 6. Mount, calib step, assume axes
      // Mount = Celestron AVX/CGE/CGEM/CGX, Calibration Step = 2000 ms, Assume orthogonal axes = no
      re = /Mount = (.*), Calibration Step = (.*) ms, Assume orthogonal axes = (.*)/g;
      match = re.exec(currentLine);
      if (match === null) {
        throw new Error('Unable to parse Mount line.');
      }
      const mount: string = match[1];
      const calibrationStep: number = parseInt(match[2]);
      const assumeOrthogonalAxes: string = match[3];
      updateCurrentLine();

      // 7. Dec, Hour angle, Pierside, rotator pos
      // Dec = 41.8 deg, Hour angle = -3.78 hr, Pier side = Unknown, Rotator pos = N/A
      const { degrees, hourAngle, pierSide, rotatorPosition } = parseDecLine();

      // 8. Lock, star, hfd
      // Lock position = 615.602, 127.508, Star position = 615.291, 127.665, HFD = 3.60 px
      const { lockPositionX, lockPositionY, starPositionX, starPositionY, halfFluxDiameterInPixels } = parseLockLine();

      const calibrationSession: CalibrationSession = {
        dateTime: startTime, camera, equipmentProfile,
        exposure, pixelScale, binning, focalLength,
        mount, calibrationStep, assumeOrthogonalAxes,
        degrees, hourAngle, pierSide, rotatorPosition,
        lockPositionX, lockPositionY, starPositionX, starPositionY, halfFluxDiameterInPixels,
        calibrationSteps: [], northCalibrationAngle: 0, northCalibrationParity: '',
        northCalibrationRate: 0, westCalibrationAngle: 0, westCalibrationParity: '', westCalibrationRate: 0
      };

      // 9. data loop
      while (!currentLine.startsWith('Calibration')) {
        updateCurrentLine();
        if (currentLine.startsWith('West calibration')) {
          // set west stuff
          re = /West calibration complete. Angle = (.*) deg, Rate = (.*) px\/sec, Parity = (.*)/g;
          match = re.exec(currentLine);
          if (match === null) {
            throw new Error('Unable to parse West calibration line.');
          }
          const westCalibrationAngle: number = parseFloat(match[1]);
          const westCalibrationRate: number = parseFloat(match[2]);
          const westCalibrationParity: string = match[3];
          calibrationSession.westCalibrationAngle = westCalibrationAngle;
          calibrationSession.westCalibrationRate = westCalibrationRate;
          calibrationSession.westCalibrationParity = westCalibrationParity;
          updateCurrentLine();
        } else if (currentLine.startsWith('North calibration')) {
          // set north stuff
          re = /North calibration complete. Angle = (.*) deg, Rate = (.*) px\/sec, Parity = (.*)/g;
          match = re.exec(currentLine);
          if (match === null) {
            throw new Error('Unable to parse North calibration line.');
          }
          const northCalibrationAngle: number = parseFloat(match[1]);
          const northCalibrationRate: number = parseFloat(match[2]);
          const northCalibrationParity: string = match[3];
          calibrationSession.northCalibrationAngle = northCalibrationAngle;
          calibrationSession.northCalibrationRate = northCalibrationRate;
          calibrationSession.northCalibrationParity = northCalibrationParity;
          updateCurrentLine();
        }

        // Direction,Step,dx,dy,x,y,Dist
        // West,0,0.000,0.000,615.356,127.540,0.000
        const cells: string[] = currentLine.split(',');
        const step: CalibrationStep = {
          direction: cells[0],
          step: parseInt(cells[1]),
          dx: parseFloat(cells[2]),
          dy: parseFloat(cells[3]),
          x: parseFloat(cells[4]),
          y: parseFloat(cells[5]),
          distance: parseFloat(cells[6]),
        };
        calibrationSession.calibrationSteps.push(step);
      }
      updateCurrentLine();
      return calibrationSession;
    }

    updateCurrentLine();

    const re = /PHD2 version, Log version (.*). Log enabled at (.*)/g;
    const match = re.exec(currentLine);

    if (match === null) {
      throw new Error('Unable to parse PHD2 log start line.');
    }
    const phdLogVersion: string = match[1];
    const logDateTime: Date = new Date(match[2]);

    const phdLog: PHDLog = { phdLogVersion, datetime: logDateTime, guidingSessions: [], calibrationSessions: [] };
    let currentGuidingSession: GuidingSession | null = null;

    updateCurrentLine();

    while (index < lines.length) {
      if (currentLine.startsWith('Guiding Begins')) {
        startGuidingSession();
      } else if (currentLine.startsWith('Guiding Ends')) {
        endGuidingSession();
      } else if (currentLine.startsWith('Calibration Begins')) {
        const calibrationSession: CalibrationSession = parseCalibrationSession();
        phdLog.calibrationSessions.push(calibrationSession);
      } else {
        // add frame to guiding session
        if (!updateCurrentLine()) {
          break;
        }
        // Frame,Time,mount,dx,dy,RARawDistance,DECRawDistance,RAGuideDistance,DECGuideDistance,RADuration,RADirection,DECDuration,DECDirection,XStep,YStep,StarMass,SNR,ErrorCode
        // 1,1.894,"Mount",-0.335,-0.207,-0.348,0.194,-0.219,0.000,522,E,0,,,,1330,25.34,0

        const cells: string[] = currentLine.split(',');
        const mount: string = cells[2]?.replaceAll('\"', '');
        let guidingFrame: GuidingFrame;
        const timeInMilliseconds: number = parseFloat(cells[1]) * 1_000;
        const currentTime = new Date(currentGuidingSession!.startTime!.getTime() + timeInMilliseconds);

        if (mount === 'DROP') {
          guidingFrame = {
            frame: parseInt(cells[0]),
            mount: mount,
            ErrorCode: cells[17]
          } as GuidingFrame;
          continue;
        } else {
          guidingFrame = {
            frame: parseInt(cells[0]),
            timeInMilliseconds: timeInMilliseconds,
            datetime: currentTime,
            mount: mount,
            dx: parseFloat(cells[3]),
            dy: parseFloat(cells[4]),
            RARawDistance: parseFloat(cells[5]),
            DECRawDistance: parseFloat(cells[6]),
            RAGuideDistance: parseFloat(cells[7]),
            DECGuideDistance: parseFloat(cells[8]),
            RADuration: parseFloat(cells[9]),
            RADirection: cells[10],
            DECDuration: parseFloat(cells[11]),
            DECDirection: cells[12],
            XStep: parseFloat(cells[13]),
            YStep: parseFloat(cells[14]),
            StarMass: parseFloat(cells[15]),
            SNR: parseFloat(cells[16]),
            ErrorCode: cells[17]?.replaceAll('\"', '')
          };
        }
        if (!isNaN(guidingFrame.frame)) {
          currentGuidingSession!.guidingFrames.push(guidingFrame);
          currentGuidingSession!.endTime = guidingFrame.datetime;
          }
      }
    }

    return phdLog;
  }
}
