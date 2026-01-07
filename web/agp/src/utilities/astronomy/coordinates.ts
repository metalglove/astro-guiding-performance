const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const HOURS2RAD = Math.PI / 12;
const RAD2HOURS = 12 / Math.PI;

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface CelestialCoordinates {
  ra: number;
  dec: number;
}

export interface HorizontalCoordinates {
  altitude: number;
  azimuth: number;
}

export function julianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  let jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

  return jd;
}

export function localSiderealTime(jd: number, longitude: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
             0.000387933 * t * t - (t * t * t) / 38710000.0;
  
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  
  const lst = (gmst + longitude) % 360;
  
  return lst / 15;
}

export function calculateAltAz(
  coords: CelestialCoordinates,
  location: ObserverLocation,
  datetime: Date
): HorizontalCoordinates {
  const jd = julianDate(datetime);
  const lst = localSiderealTime(jd, location.longitude);
  
  const ha = (lst - coords.ra) * 15;
  
  const sinAlt = Math.sin(coords.dec * DEG2RAD) * Math.sin(location.latitude * DEG2RAD) +
                 Math.cos(coords.dec * DEG2RAD) * Math.cos(location.latitude * DEG2RAD) * 
                 Math.cos(ha * DEG2RAD);
  
  const altitude = Math.asin(sinAlt) * RAD2DEG;
  
  const cosA = (Math.sin(coords.dec * DEG2RAD) - 
               Math.sin(altitude * DEG2RAD) * Math.sin(location.latitude * DEG2RAD)) /
               (Math.cos(altitude * DEG2RAD) * Math.cos(location.latitude * DEG2RAD));
  
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosA))) * RAD2DEG;
  
  if (Math.sin(ha * DEG2RAD) > 0) {
    azimuth = 360 - azimuth;
  }
  
  return { altitude, azimuth };
}

export function calculateHourAngle(
  ra: number,
  location: ObserverLocation,
  datetime: Date
): number {
  const jd = julianDate(datetime);
  const lst = localSiderealTime(jd, location.longitude);
  return lst - ra;
}

export function calculateSunPosition(datetime: Date): CelestialCoordinates {
  const jd = julianDate(datetime);
  const n = jd - 2451545.0;
  const l = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG2RAD;
  
  const lambda = (l + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG2RAD;
  const epsilon = (23.439 - 0.0000004 * n) * DEG2RAD;
  
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * RAD2DEG / 15;
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) * RAD2DEG;
  
  return { ra: ra < 0 ? ra + 24 : ra, dec };
}

export function calculateSunset(location: ObserverLocation, date: Date): Date {
  const noon = new Date(date);
  noon.setUTCHours(12, 0, 0, 0);
  
  for (let hour = 12; hour < 24; hour += 0.25) {
    const testDate = new Date(noon);
    testDate.setUTCHours(hour);
    
    const sunPos = calculateSunPosition(testDate);
    const altAz = calculateAltAz(sunPos, location, testDate);
    
    if (altAz.altitude < -6) {
      return testDate;
    }
  }
  
  return new Date(noon.getTime() + 18 * 3600000);
}

export function calculateSunrise(location: ObserverLocation, date: Date): Date {
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);
  
  for (let hour = 0; hour < 12; hour += 0.25) {
    const testDate = new Date(midnight);
    testDate.setUTCHours(hour);
    
    const sunPos = calculateSunPosition(testDate);
    const altAz = calculateAltAz(sunPos, location, testDate);
    
    if (altAz.altitude > -6) {
      return testDate;
    }
  }
  
  return new Date(midnight.getTime() + 6 * 3600000);
}

export function calculateMoonPhase(datetime: Date): number {
  const jd = julianDate(datetime);
  const daysSinceNew = (jd - 2451550.1) % 29.530588853;
  return daysSinceNew / 29.530588853;
}

export function calculateMoonIllumination(phase: number): number {
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2;
}
