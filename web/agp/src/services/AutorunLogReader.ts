import { AutoCenterEvent, AutoFocusEvent, Autorun, AutorunLog, ExposureEvent, VCurveMeasurement } from '../utilities/AutorunLog';

export default class AutorunLogReader {
  public parseText(text: string): AutorunLog {
    if (!text.startsWith('Log enabled at')) {
      throw new Error('Invalid Autorun log text file.');
    }

    const logDateTime: Date = new Date(text.slice(15, 35));
    const lines: string[] = text.split('\r\n');
    let index = -1;
    let currentLine = '';
    let currentDateTime = '';
    const autorunLog: AutorunLog = new AutorunLog(logDateTime);

    let currentAutorun: Autorun | null = null;

    function updateCurrentLine(): boolean {
      index += 1;
      if (index == lines.length) {
        return false;
      }
      const line: string = lines[index];
      if (line.startsWith('Log')) {
        return updateCurrentLine();
      } else {
        currentDateTime = line.slice(0, 19);
        currentLine = line.slice(20);
        return true;
      }
    }

    while (index < lines.length) {
      updateCurrentLine()
      if (currentLine.startsWith('[Autorun|Begin]')) {
        const re = /\[Autorun\|Begin\] (.*) Start/g;
        const match = re.exec(currentLine);

        if (match === null) {
          throw new Error('Unable to parse Autorun plan name.');
        }
        currentAutorun = new Autorun(match[1], new Date(currentDateTime));
      } else if (currentLine.startsWith('[Autorun|End]') && currentAutorun !== null) {
        currentAutorun.endTime = new Date(currentDateTime);
        autorunLog.addAutorun(currentAutorun);
        currentAutorun = null;
      } else if (currentLine.startsWith('[AutoCenter|Begin]') && currentAutorun !== null) {
        let re = /\[AutoCenter\|Begin\] Auto-Center (.*)\#/g;
        let match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse AutoCenter attempt name.');
        }
        const autoCenterEvent: AutoCenterEvent = {} as AutoCenterEvent;
        autoCenterEvent.attempt = parseInt(match[1]);
        autoCenterEvent.startTime = new Date(currentDateTime);

        updateCurrentLine();
        re = /Mount slews to target position: RA:(.*) DEC:(.*)/g;
        match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse expected Mount slews line.');
        }
        autoCenterEvent.targetPosition = { RA: match[1], DEC: match[2] };

        index += 2; // skip exposure and plate solve lines.
        updateCurrentLine();
        re = /Solve succeeded: RA:(.*) DEC:(.*) Angle = (.*), Star number = (.*)/g;
        match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse expected Solve succeeded line.');
        }
        autoCenterEvent.solvedPosition = { RA: match[1], DEC: match[2] };
        autoCenterEvent.solvedAngle = parseFloat(match[3]);
        autoCenterEvent.detectedStars = parseInt(match[4]);

        updateCurrentLine();
        if (currentLine === 'Pierside is wrong') {
          updateCurrentLine();
        }
        if (currentLine === '[AutoCenter|End] The target is centered') {
          currentAutorun.addAutoCenterEvent(autoCenterEvent);
          continue;
        }

        re = /\[AutoCenter\|End\] Too far from center, distance = (.*)/g;
        match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse expected AutoCenter End line.');
        } else {
          autoCenterEvent.distanceFromCenter = match[1];
        }
        currentAutorun.addAutoCenterEvent(autoCenterEvent);
      } else if (currentLine.startsWith('[AutoFocus|Begin]') && currentAutorun !== null) {
        const re = /\[AutoFocus\|Begin\] (?:Run AF before Autorun start|Run AF .* later), exposure (.*), temperature (.*)℃/g;
        const match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse AutoFocus begin line.');
        }
        const autoFocusEvent: AutoFocusEvent = {
          startTime: new Date(currentDateTime),
          endTime: new Date(currentDateTime), // temp
          focusPosition: -1,
          temperature: parseFloat(match[2]),
          vCurveMeasurements: [],
        };
        let autoFocusFailed = false;
        while (currentLine !== 'Calculate V-Curve') {
          if (currentLine === 'Cancel AF Manually') {
            while (!currentLine.startsWith('[AutoFocus|End]')) {
              updateCurrentLine();
            }
            autoFocusEvent.endTime = new Date(currentDateTime);
            autoFocusFailed = true;
            break;
          }
          updateCurrentLine();
        }
        if (!autoFocusFailed) {
          updateCurrentLine();
          while (!currentLine.startsWith('Find Focus Point')) {
            const re = /Calculate V-Curve: detect and calculate star size (.*) ,  EAF position (.*)/g;
            const match = re.exec(currentLine);
            if (match === null) {
              throw new Error('Unable to parse Calculate V-Curve line.');
            }
            const vCurveMeasurement: VCurveMeasurement = {
              datetime: new Date(currentDateTime),
              starSize: parseFloat(match[1]),
              eafPosition: parseInt(match[2]),
            };
            autoFocusEvent.vCurveMeasurements = autoFocusEvent.vCurveMeasurements.concat(vCurveMeasurement);
            updateCurrentLine();
          }
          while (!currentLine.startsWith('Auto focus succeeded')) {
            updateCurrentLine();
          }
          const re = /Auto focus succeeded, the focused position is (.*)/g;
          const match = re.exec(currentLine);
          if (match === null) {
            throw new Error('Unable to parse Auto focus succeeded position line.');
          }
          autoFocusEvent.focusPosition = parseInt(match[1]);
        }
        currentAutorun.addAutoFocusEvent(autoFocusEvent);

      } else if (currentLine.startsWith('Exposure') && currentAutorun !== null) {
        // TODO: else if could also be regex instead of
        // startsWith using exposure and image as groups
        const re = /Exposure (.*) image (.*)\#/g;
        const match = re.exec(currentLine);
        if (match === null) {
          throw new Error('Unable to parse Exposure line.');
        }
        const exposure: ExposureEvent = {
          datetime: new Date(currentDateTime),
          integrationTime: match[1],
          image: parseInt(match[2])
        };
        currentAutorun.addExposureEvent(exposure);
      }
    }
    return autorunLog;
  }
}