/**
 * Sidereal time calculation utilities
 *
 * Provides functions for calculating Local Sidereal Time (LST) and
 * Greenwich Mean Sidereal Time (GMST) from UTC timestamps.
 *
 * These calculations are essential for converting between hour angle
 * and right ascension coordinates.
 *
 * References:
 * - Meeus, Jean. "Astronomical Algorithms" (2nd ed., 1998)
 * - USNO Circular 179 (2005)
 */

const HOURS_TO_DEG = 15; // 1 hour = 15 degrees
const DEG_TO_HOURS = 1 / 15; // 1 degree = 1/15 hours

/**
 * Calculate Julian Date from JavaScript Date object
 *
 * Julian Date is a continuous count of days since noon on January 1, 4713 BC.
 * Used as the basis for astronomical time calculations.
 *
 * @param date - JavaScript Date object (in UTC)
 * @returns Julian Date as a decimal number
 */
export function dateToJulianDate(date: Date): number {
  // Get time components in UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const millisecond = date.getUTCMilliseconds();

  // Calculate decimal day
  const decimalDay =
    day + hour / 24 + minute / 1440 + second / 86400 + millisecond / 86400000;

  // Adjust year and month for algorithm
  let y = year;
  let m = month;
  if (month <= 2) {
    y -= 1;
    m += 12;
  }

  // Julian calendar correction (only for dates after Oct 15, 1582)
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  // Calculate Julian Date
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    decimalDay +
    b -
    1524.5;

  return jd;
}

/**
 * Calculate Julian centuries from J2000.0 epoch
 *
 * J2000.0 is the standard astronomical epoch (noon on January 1, 2000).
 * Time is measured in Julian centuries (36525 days).
 *
 * @param jd - Julian Date
 * @returns Julian centuries since J2000.0
 */
export function julianCenturiesSinceJ2000(jd: number): number {
  const J2000 = 2451545.0; // Julian Date of J2000.0 epoch
  return (jd - J2000) / 36525.0;
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) in hours
 *
 * GMST is the hour angle of the vernal equinox at Greenwich.
 * It represents the rotation of the Earth relative to distant stars.
 *
 * Formula from USNO Circular 179:
 * GMST = 18.697374558 + 24.06570982441908 * D
 *        + correction terms for precision
 *
 * @param date - JavaScript Date object (in UTC)
 * @returns GMST in hours (0-24)
 */
export function calculateGMST(date: Date): number {
  const jd = dateToJulianDate(date);
  const T = julianCenturiesSinceJ2000(jd);

  // GMST at 0h UT (midnight)
  const jd0 = Math.floor(jd - 0.5) + 0.5; // Julian Date at 0h UT
  const T0 = julianCenturiesSinceJ2000(jd0);

  // Calculate GMST at 0h UT using polynomial expansion
  // Formula: θ₀ = 100.46061837 + 36000.770053608 * T₀ + 0.000387933 * T₀² - T₀³ / 38710000
  let gmst0 =
    100.46061837 +
    36000.770053608 * T0 +
    0.000387933 * T0 * T0 -
    (T0 * T0 * T0) / 38710000;

  // Convert to 0-360 degree range
  gmst0 = gmst0 % 360;
  if (gmst0 < 0) gmst0 += 360;

  // Calculate Universal Time as fraction of day
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  // GMST = GMST at 0h + UT * 1.00273790935 (sidereal rate)
  // The factor 1.00273790935 accounts for Earth's orbital motion
  const siderealRate = 1.00273790935;
  let gmst = gmst0 + ut * 15 * siderealRate; // 15 deg/hour conversion

  // Normalize to 0-360 degrees
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;

  // Convert degrees to hours
  return gmst * DEG_TO_HOURS;
}

/**
 * Calculate Local Sidereal Time (LST) in hours
 *
 * LST is the sidereal time at a specific longitude on Earth.
 * LST = GMST + longitude (in hours)
 *
 * Positive longitude is East, negative is West.
 *
 * @param date - JavaScript Date object (in UTC)
 * @param longitude - Observer's longitude in degrees (+ East, - West)
 * @returns LST in hours (0-24)
 */
export function calculateLST(date: Date, longitude: number): number {
  const gmst = calculateGMST(date);

  // Convert longitude from degrees to hours
  const longitudeHours = longitude * DEG_TO_HOURS;

  // LST = GMST + longitude
  let lst = gmst + longitudeHours;

  // Normalize to 0-24 hour range
  lst = lst % 24;
  if (lst < 0) lst += 24;

  return lst;
}

/**
 * Calculate Local Sidereal Time with default longitude if not provided
 *
 * If longitude is not available from session metadata, returns GMST as fallback.
 * This provides approximate sidereal time but should be replaced with actual
 * location data when available.
 *
 * @param date - JavaScript Date object (in UTC)
 * @param longitude - Optional observer's longitude in degrees
 * @returns LST or GMST in hours (0-24)
 */
export function calculateLSTOrGMST(
  date: Date,
  longitude?: number
): number {
  if (longitude !== undefined && longitude !== null) {
    return calculateLST(date, longitude);
  }

  // Fallback to GMST if no longitude available
  console.warn(
    'No longitude provided for LST calculation, using GMST as approximation. ' +
    'RA calculations may be inaccurate without observer location.'
  );
  return calculateGMST(date);
}

/**
 * Calculate Hour Angle from Right Ascension and Local Sidereal Time
 *
 * Hour Angle = LST - RA
 * - Negative HA: Object is east of meridian (rising)
 * - Zero HA: Object is on meridian (highest altitude)
 * - Positive HA: Object is west of meridian (setting)
 *
 * @param ra - Right Ascension in degrees
 * @param lst - Local Sidereal Time in hours
 * @returns Hour angle in hours (-12 to +12)
 */
export function raToHourAngle(ra: number, lst: number): number {
  const raHours = ra / HOURS_TO_DEG;
  let hourAngle = lst - raHours;

  // Normalize to range -12 to +12 hours
  while (hourAngle > 12) hourAngle -= 24;
  while (hourAngle < -12) hourAngle += 24;

  return hourAngle;
}

/**
 * Calculate Right Ascension from Hour Angle and Local Sidereal Time
 *
 * RA = LST - Hour Angle
 *
 * This is the key function for preprocessing PHD2 log data, which contains
 * hour angle but not RA. We calculate LST from timestamp and location,
 * then derive RA.
 *
 * @param hourAngle - Hour angle in hours
 * @param lst - Local Sidereal Time in hours
 * @returns Right Ascension in degrees (0-360)
 */
export function hourAngleToRA(hourAngle: number, lst: number): number {
  let ra = (lst - hourAngle) * HOURS_TO_DEG;

  // Normalize to range 0-360 degrees
  while (ra < 0) ra += 360;
  while (ra >= 360) ra -= 360;

  return ra;
}

/**
 * Format sidereal time as HH:MM:SS
 *
 * @param siderealTimeHours - Sidereal time in decimal hours
 * @returns Formatted string "HH:MM:SS"
 */
export function formatSiderealTime(siderealTimeHours: number): string {
  const hours = Math.floor(siderealTimeHours);
  const minutes = Math.floor((siderealTimeHours - hours) * 60);
  const seconds = ((siderealTimeHours - hours) * 60 - minutes) * 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/**
 * Validate that a timestamp is reasonable for astronomical calculations
 *
 * Checks that date is within a reasonable range (1990-2100) to avoid
 * issues with invalid dates or deserialization errors.
 *
 * @param date - Date to validate
 * @returns true if date is valid and within range
 */
export function isValidAstronomicalDate(date: Date): boolean {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }

  const year = date.getUTCFullYear();
  return year >= 1990 && year <= 2100;
}
