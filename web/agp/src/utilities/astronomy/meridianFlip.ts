import { 
  CelestialCoordinates, 
  ObserverLocation,
  calculateHourAngle
} from './coordinates';

export interface MeridianFlipPrediction {
  isRequired: boolean;
  timeToFlip: number;
  flipTime: Date | null;
  currentHourAngle: number;
  flipHourAngle: number;
  side: 'east' | 'west';
  safetyMargin: number;
}

export interface MountLimits {
  eastLimit: number;
  westLimit: number;
  meridianDelay: number;
}

const DEFAULT_MOUNT_LIMITS: MountLimits = {
  eastLimit: -5,
  westLimit: 5,
  meridianDelay: 0
};

export function predictMeridianFlip(
  target: CelestialCoordinates,
  location: ObserverLocation,
  currentTime: Date,
  mountLimits: MountLimits = DEFAULT_MOUNT_LIMITS
): MeridianFlipPrediction {
  const currentHA = calculateHourAngle(target.ra, location, currentTime);
  
  const side = currentHA < 0 ? 'east' : 'west';
  
  const flipHourAngle = side === 'east' 
    ? mountLimits.eastLimit 
    : mountLimits.westLimit;
  
  const hoursToFlip = side === 'east'
    ? flipHourAngle - currentHA
    : currentHA - flipHourAngle;
  
  const isRequired = side === 'east' 
    ? currentHA <= flipHourAngle 
    : currentHA >= flipHourAngle;
  
  let flipTime: Date | null = null;
  let timeToFlip = 0;
  
  if (!isRequired && hoursToFlip > 0) {
    const minutesToFlip = hoursToFlip * 60;
    timeToFlip = minutesToFlip;
    flipTime = new Date(currentTime.getTime() + minutesToFlip * 60000);
  }
  
  const safetyMargin = Math.abs(hoursToFlip) * 60;
  
  return {
    isRequired,
    timeToFlip,
    flipTime,
    currentHourAngle: currentHA,
    flipHourAngle,
    side,
    safetyMargin
  };
}

export function calculateFlipWindows(
  target: CelestialCoordinates,
  location: ObserverLocation,
  startTime: Date,
  durationMinutes: number,
  mountLimits: MountLimits = DEFAULT_MOUNT_LIMITS
): { eastWindow: [Date, Date] | null; westWindow: [Date, Date] | null; flipTime: Date | null } {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  
  let flipTime: Date | null = null;
  let eastWindow: [Date, Date] | null = null;
  let westWindow: [Date, Date] | null = null;
  
  for (let minutes = 0; minutes <= durationMinutes; minutes += 5) {
    const checkTime = new Date(startTime.getTime() + minutes * 60000);
    const ha = calculateHourAngle(target.ra, location, checkTime);
    
    if (ha >= mountLimits.eastLimit && ha <= 0) {
      if (!eastWindow) {
        eastWindow = [checkTime, checkTime];
      } else {
        eastWindow[1] = checkTime;
      }
    }
    
    if (ha > 0 && ha <= mountLimits.westLimit) {
      if (!westWindow) {
        westWindow = [checkTime, checkTime];
        if (eastWindow) {
          flipTime = checkTime;
        }
      } else {
        westWindow[1] = checkTime;
      }
    }
  }
  
  return { eastWindow, westWindow, flipTime };
}

export function isFlipSafe(
  target: CelestialCoordinates,
  location: ObserverLocation,
  currentTime: Date,
  exposureSeconds: number,
  mountLimits: MountLimits = DEFAULT_MOUNT_LIMITS
): { safe: boolean; margin: number; recommendation: string } {
  const prediction = predictMeridianFlip(target, location, currentTime, mountLimits);
  
  const exposureMinutes = exposureSeconds / 60;
  
  if (prediction.isRequired) {
    return {
      safe: false,
      margin: 0,
      recommendation: 'Meridian flip required immediately. Do not start new exposure.'
    };
  }
  
  if (prediction.timeToFlip === 0) {
    return {
      safe: false,
      margin: 0,
      recommendation: 'Target at or past flip limit. Flip immediately.'
    };
  }
  
  const margin = prediction.timeToFlip - exposureMinutes;
  
  if (margin < 0) {
    return {
      safe: false,
      margin,
      recommendation: `Exposure (${exposureMinutes.toFixed(1)} min) will exceed flip time. Flip first or reduce exposure.`
    };
  }
  
  if (margin < 5) {
    return {
      safe: false,
      margin,
      recommendation: `Only ${margin.toFixed(1)} min margin. Too close to flip time. Consider flipping now.`
    };
  }
  
  if (margin < 15) {
    return {
      safe: true,
      margin,
      recommendation: `${margin.toFixed(1)} min margin before flip. Monitor closely or flip after this exposure.`
    };
  }
  
  return {
    safe: true,
    margin,
    recommendation: `${margin.toFixed(1)} min margin. Safe to proceed with exposure.`
  };
}

export function calculateOptimalFlipTime(
  target: CelestialCoordinates,
  location: ObserverLocation,
  startTime: Date,
  endTime: Date,
  mountLimits: MountLimits = DEFAULT_MOUNT_LIMITS
): Date | null {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
  
  for (let minutes = 0; minutes <= durationMinutes; minutes++) {
    const checkTime = new Date(startTime.getTime() + minutes * 60000);
    const ha = calculateHourAngle(target.ra, location, checkTime);
    
    if (Math.abs(ha - mountLimits.meridianDelay) < 0.01) {
      return checkTime;
    }
    
    if (ha > mountLimits.meridianDelay && minutes > 0) {
      const prevTime = new Date(startTime.getTime() + (minutes - 1) * 60000);
      return prevTime;
    }
  }
  
  return null;
}
