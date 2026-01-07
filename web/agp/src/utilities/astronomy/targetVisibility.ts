import { 
  CelestialCoordinates, 
  ObserverLocation, 
  HorizontalCoordinates,
  calculateAltAz,
  calculateSunset,
  calculateSunrise,
  calculateHourAngle
} from './coordinates';

export interface VisibilityWindow {
  start: Date;
  end: Date;
  maxAltitude: number;
  maxAltitudeTime: Date;
  transitTime: Date;
  isCircumpolar: boolean;
}

export interface VisibilityPoint {
  time: Date;
  altitude: number;
  azimuth: number;
  hourAngle: number;
  airmass: number;
}

export interface TargetVisibility {
  target: CelestialCoordinates;
  location: ObserverLocation;
  date: Date;
  points: VisibilityPoint[];
  darkTimeWindow: VisibilityWindow;
  bestObservingWindow?: VisibilityWindow;
  neverRises: boolean;
  alwaysUp: boolean;
}

const MINIMUM_ALTITUDE = 30;
const AIRMASS_LIMIT = 2.0;

/**
 * Calculate airmass using the Rozenberg formula
 * Valid for altitudes > 0°
 */
export function calculateAirmass(altitude: number): number {
  if (altitude <= 0) return Infinity;
  
  const zenithAngle = 90 - altitude;
  const zenithRad = zenithAngle * Math.PI / 180;
  
  // Rozenberg formula (more accurate than sec(z) for low altitudes)
  const airmass = 1 / (Math.cos(zenithRad) + 0.025 * Math.exp(-11 * Math.cos(zenithRad)));
  
  return airmass;
}

/**
 * Calculate target visibility over a 24-hour period
 */
export function calculateTargetVisibility(
  target: CelestialCoordinates,
  location: ObserverLocation,
  date: Date,
  intervalMinutes: number = 15
): TargetVisibility {
  const points: VisibilityPoint[] = [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Calculate positions every intervalMinutes
  const totalPoints = Math.floor((24 * 60) / intervalMinutes);
  
  for (let i = 0; i <= totalPoints; i++) {
    const time = new Date(startOfDay.getTime() + i * intervalMinutes * 60000);
    const altAz = calculateAltAz(target, location, time);
    const ha = calculateHourAngle(target.ra, location, time);
    const airmass = calculateAirmass(altAz.altitude);
    
    points.push({
      time,
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      hourAngle: ha,
      airmass
    });
  }
  
  // Find max altitude and transit time
  let maxAltitude = -90;
  let maxAltitudeTime = startOfDay;
  let transitTime = startOfDay;
  
  for (const point of points) {
    if (point.altitude > maxAltitude) {
      maxAltitude = point.altitude;
      maxAltitudeTime = point.time;
    }
    // Transit is when hour angle is closest to 0
    if (Math.abs(point.hourAngle) < Math.abs(calculateHourAngle(target.ra, location, transitTime))) {
      transitTime = point.time;
    }
  }
  
  // Determine if target is circumpolar or never rises
  const neverRises = maxAltitude < 0;
  const alwaysUp = points.every(p => p.altitude > 0);
  
  // Calculate dark time window (civil twilight to civil twilight)
  const sunset = calculateSunset(location, date);
  const sunrise = calculateSunrise(location, new Date(date.getTime() + 86400000)); // Next day's sunrise
  
  const darkTimeWindow: VisibilityWindow = {
    start: sunset,
    end: sunrise,
    maxAltitude,
    maxAltitudeTime,
    transitTime,
    isCircumpolar: alwaysUp
  };
  
  // Find best observing window (altitude > MINIMUM_ALTITUDE, airmass < AIRMASS_LIMIT, during dark time)
  let bestObservingWindow: VisibilityWindow | undefined;
  
  if (!neverRises) {
    const goodPoints = points.filter(p => 
      p.altitude >= MINIMUM_ALTITUDE && 
      p.airmass <= AIRMASS_LIMIT &&
      p.time >= sunset &&
      p.time <= sunrise
    );
    
    if (goodPoints.length > 0) {
      const bestStart = goodPoints[0].time;
      const bestEnd = goodPoints[goodPoints.length - 1].time;
      const bestMaxAlt = Math.max(...goodPoints.map(p => p.altitude));
      const bestMaxAltPoint = goodPoints.find(p => p.altitude === bestMaxAlt)!;
      
      bestObservingWindow = {
        start: bestStart,
        end: bestEnd,
        maxAltitude: bestMaxAlt,
        maxAltitudeTime: bestMaxAltPoint.time,
        transitTime,
        isCircumpolar: alwaysUp
      };
    }
  }
  
  return {
    target,
    location,
    date,
    points,
    darkTimeWindow,
    bestObservingWindow,
    neverRises,
    alwaysUp
  };
}

/**
 * Calculate when a target rises above a given altitude
 */
export function findRiseTime(
  target: CelestialCoordinates,
  location: ObserverLocation,
  date: Date,
  minAltitude: number = 0
): Date | null {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Check every 5 minutes for rise time
  for (let minutes = 0; minutes < 24 * 60; minutes += 5) {
    const time = new Date(startOfDay.getTime() + minutes * 60000);
    const altAz = calculateAltAz(target, location, time);
    
    if (altAz.altitude >= minAltitude) {
      // Refine to the minute
      for (let min = -5; min < 5; min++) {
        const refineTime = new Date(time.getTime() + min * 60000);
        const refineAltAz = calculateAltAz(target, location, refineTime);
        if (refineAltAz.altitude >= minAltitude) {
          return refineTime;
        }
      }
      return time;
    }
  }
  
  return null;
}

/**
 * Calculate when a target sets below a given altitude
 */
export function findSetTime(
  target: CelestialCoordinates,
  location: ObserverLocation,
  date: Date,
  minAltitude: number = 0
): Date | null {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  let wasAbove = false;
  
  // Check every 5 minutes for set time
  for (let minutes = 0; minutes < 24 * 60; minutes += 5) {
    const time = new Date(startOfDay.getTime() + minutes * 60000);
    const altAz = calculateAltAz(target, location, time);
    
    if (altAz.altitude >= minAltitude) {
      wasAbove = true;
    } else if (wasAbove) {
      // Refine to the minute
      for (let min = -5; min < 5; min++) {
        const refineTime = new Date(time.getTime() + min * 60000);
        const refineAltAz = calculateAltAz(target, location, refineTime);
        if (refineAltAz.altitude < minAltitude) {
          return refineTime;
        }
      }
      return time;
    }
  }
  
  return null;
}

/**
 * Find the optimal observation time (highest altitude during dark hours)
 */
export function findOptimalObservingTime(
  target: CelestialCoordinates,
  location: ObserverLocation,
  date: Date
): Date | null {
  const visibility = calculateTargetVisibility(target, location, date);
  
  if (visibility.neverRises) return null;
  
  if (visibility.bestObservingWindow) {
    return visibility.bestObservingWindow.maxAltitudeTime;
  }
  
  // If no "best" window, return transit time during dark hours if possible
  const sunset = calculateSunset(location, date);
  const sunrise = calculateSunrise(location, new Date(date.getTime() + 86400000));
  
  if (visibility.darkTimeWindow.transitTime >= sunset && 
      visibility.darkTimeWindow.transitTime <= sunrise) {
    return visibility.darkTimeWindow.transitTime;
  }
  
  return null;
}

/**
 * Check if two targets are visible during overlapping time windows
 */
export function findOverlappingVisibility(
  target1: CelestialCoordinates,
  target2: CelestialCoordinates,
  location: ObserverLocation,
  date: Date
): { start: Date; end: Date; duration: number } | null {
  const vis1 = calculateTargetVisibility(target1, location, date);
  const vis2 = calculateTargetVisibility(target2, location, date);
  
  if (vis1.neverRises || vis2.neverRises) return null;
  if (!vis1.bestObservingWindow || !vis2.bestObservingWindow) return null;
  
  const start1 = vis1.bestObservingWindow.start;
  const end1 = vis1.bestObservingWindow.end;
  const start2 = vis2.bestObservingWindow.start;
  const end2 = vis2.bestObservingWindow.end;
  
  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;
  
  if (overlapStart >= overlapEnd) return null;
  
  const duration = (overlapEnd.getTime() - overlapStart.getTime()) / 60000; // minutes
  
  return {
    start: overlapStart,
    end: overlapEnd,
    duration
  };
}
