import { AutoCenterEvent, AutoFocusEvent, Autorun, AutorunLog, ExposureEvent, VCurveMeasurement, DitherEvent } from '../utilities/AutorunLog';

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
        if (currentLine.startsWith('Angle')) {
          return updateCurrentLine();
        }
        return true;
      }
    }
    let currentFrameType = '';

    while (index < lines.length) {
      updateCurrentLine()
      if (currentLine.startsWith('[Autorun|Begin]')) {
        const re = /\[Autorun\|Begin\] (.*) Start/g;
        const match = re.exec(currentLine);

        if (match === null) {
          throw new Error(`Unable to parse Autorun plan name (line: ${index}).`);
        }
        currentAutorun = new Autorun(match[1], new Date(currentDateTime));
      } else if (currentAutorun == null) {
        continue;
      } else if (currentLine.startsWith('[Autorun|End]')) {
        currentAutorun.endTime = new Date(currentDateTime);
        if (currentAutorun.exposureEvents.length >= 1) {
          autorunLog.addAutorun(currentAutorun);
        }
        currentAutorun = null;
      } else if (currentLine.startsWith('[AutoCenter|Begin]')) {
        let re = /\[AutoCenter\|Begin\] Auto-Center (.*)\#/g;
        let match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse AutoCenter attempt name (line: ${index}).`);
        }
        const autoCenterEvent: AutoCenterEvent = {} as AutoCenterEvent;
        autoCenterEvent.attempt = parseInt(match[1]);
        autoCenterEvent.startTime = new Date(currentDateTime);

        updateCurrentLine();
        re = /Mount slews to target position: RA:(.*) DEC:(.*)/g;
        match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse expected Mount slews line (line: ${index}).`);
        }
        autoCenterEvent.targetPosition = { RA: match[1], DEC: match[2] };

        index += 2; // skip exposure and plate solve lines.
        updateCurrentLine();
        re = /Solve succeeded: RA:(.*) DEC:(.*) Angle = (.*), Star number = (.*)/g;
        match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse expected Solve succeeded line (line: ${index}).`);
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
          throw new Error(`Unable to parse expected AutoCenter End line (line: ${index}).`);
        } else {
          autoCenterEvent.distanceFromCenter = match[1];
        }
        currentAutorun.addAutoCenterEvent(autoCenterEvent);
      } else if (currentLine.startsWith('[AutoFocus|Begin]')) {
        const re = /\[AutoFocus\|Begin\] (?:.*), exposure (?:.*), temperature (.*)(?:℉|℃)/g;
        const match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse AutoFocus begin line (line: ${index}).`);
        }
        const autoFocusEvent: AutoFocusEvent = {
          startTime: new Date(currentDateTime),
          endTime: new Date(currentDateTime), // temp
          focusPosition: -1,
          temperature: parseFloat(match[1]),
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
              throw new Error(`Unable to parse Calculate V-Curve line (line: ${index}).`);
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
            throw new Error(`Unable to parse Auto focus succeeded position line (line: ${index}).`);
          }
          autoFocusEvent.focusPosition = parseInt(match[1]);
        }
        currentAutorun.addAutoFocusEvent(autoFocusEvent);
      } else if (currentLine.startsWith('Exposure')) {
        // TODO: else if could also be regex instead of
        // startsWith using exposure and image as groups
        const re = /Exposure (.*) image (.*)\#/g;
        const match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse Exposure line (line: ${index}).`);
        }
        const exposure: ExposureEvent = {
          datetime: new Date(currentDateTime),
          integrationTime: match[1],
          image: parseInt(match[2]),
          type: currentFrameType,
        };
        currentAutorun.addExposureEvent(exposure);
      } else if (currentLine.startsWith('[Guide] Dither')) {
        const startDate: Date = new Date(currentDateTime);
        updateCurrentLine();
        updateCurrentLine(); // Dither Settle
        if (!currentLine.startsWith('[Guide] Settle')) {
          updateCurrentLine(); // [Guide] Guide line...
        }
        const re = /\[Guide\] Settle (Done|Timeout)/g;
        const match = re.exec(currentLine);
        if (match === null) {
          console.log(currentLine);
          throw new Error(`Unable to parse Guide Settle line (line: ${index}).`);
        }
        const word = match[1];
        const endDate: Date = new Date(currentDateTime);
        const ditherEvent: DitherEvent = {
          startTime: startDate,
          endTime: endDate,
          timedOut: word === 'Timeout'
        };
        currentAutorun.addDitherEvent(ditherEvent);
      } else if (currentLine.startsWith('Shooting')) {
        // Shooting 60 light frames, exposure 120.0s Bin1
        const re = /Shooting (?:.*) (.*) frames, (?:.*)/g;
        const match = re.exec(currentLine);
        if (match === null) {
          throw new Error(`Unable to parse Shooting line (line: ${index}).`);
        }

        currentFrameType = match[1][0].toUpperCase() + match[1].slice(1);
      }
    }

    return autorunLog;
  }
}
