/**
 * Astronomical coordinate transformation utilities
 *
 * Provides functions for converting between different coordinate systems
 * used in astronomy and telescope positioning.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const HOURS_TO_DEG = 15; // 1 hour = 15 degrees
const HOURS_TO_RAD = Math.PI / 12; // 1 hour = π/12 radians

/**
 * 3D vector type for Three.js compatibility
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D point type for canvas projections
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Mount orientation angles
 */
export interface MountOrientation {
  raAxisRotation: number;  // Radians
  decAxisRotation: number; // Radians
}

/**
 * Convert equatorial coordinates (RA/Dec) to 3D Cartesian vector
 *
 * This is the fundamental transformation for 3D visualization.
 * Creates a unit vector pointing to the celestial coordinates.
 *
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 * @param radius - Distance from origin (default 1 for unit sphere)
 * @returns 3D vector in Cartesian coordinates
 */
export function equatorialToCartesian(
  ra: number,
  dec: number,
  radius: number = 1
): Vector3 {
  const raRad = ra * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;

  // Spherical to Cartesian conversion
  // Standard astronomical convention:
  // - RA increases eastward (counterclockwise when viewed from north pole)
  // - Dec is angle above celestial equator
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);

  return { x, y, z };
}

/**
 * Calculate mount orientation angles from hour angle and declination
 *
 * German Equatorial Mount (GEM) orientation:
 * - RA axis: Rotation around polar axis (hour angle determines this)
 * - Dec axis: Rotation perpendicular to polar axis
 *
 * @param hourAngle - Hour angle in hours (-12 to +12)
 * @param dec - Declination in degrees
 * @param pierSide - Which side of pier telescope is on ('East' or 'West')
 * @returns Mount orientation angles in radians
 */
export function mountOrientation(
  hourAngle: number,
  dec: number,
  pierSide: 'East' | 'West'
): MountOrientation {
  // Convert hour angle to radians
  // Hour angle = LST - RA, measured in hours
  // Positive HA means object is west of meridian
  let raAxisRotation = hourAngle * HOURS_TO_RAD;

  // Declination axis rotation
  let decAxisRotation = dec * DEG_TO_RAD;

  // Pier side flip: When telescope crosses meridian, it flips 180°
  // East side: Normal pointing (HA < 0, east of meridian)
  // West side: Flipped 180° (HA > 0, west of meridian)
  if (pierSide === 'West') {
    raAxisRotation += Math.PI; // Add 180° rotation
    decAxisRotation = -decAxisRotation; // Flip Dec axis
  }

  return {
    raAxisRotation,
    decAxisRotation,
  };
}

/**
 * Stereographic projection from celestial sphere to 2D plane
 *
 * Projects celestial coordinates onto a flat plane for 2D sky charts.
 * Preserves angles (conformal mapping) and is commonly used for star charts.
 *
 * Projection is centered on (centerRA, centerDec) with configurable scale.
 *
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 * @param centerRA - RA of chart center in degrees
 * @param centerDec - Dec of chart center in degrees
 * @param scale - Pixels per radian (controls zoom level)
 * @returns 2D point in pixel coordinates
 */
export function stereographicProject(
  ra: number,
  dec: number,
  centerRA: number,
  centerDec: number,
  scale: number
): Point2D {
  // Convert to radians
  const raRad = ra * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const centerRARad = centerRA * DEG_TO_RAD;
  const centerDecRad = centerDec * DEG_TO_RAD;

  // Calculate angular distance from center
  const deltaRA = raRad - centerRARad;

  // Stereographic projection formulas
  const cosDec = Math.cos(decRad);
  const sinDec = Math.sin(decRad);
  const cosCenterDec = Math.cos(centerDecRad);
  const sinCenterDec = Math.sin(centerDecRad);
  const cosDeltaRA = Math.cos(deltaRA);

  // k is the projection factor
  const k = 2 / (1 + sinCenterDec * sinDec + cosCenterDec * cosDec * cosDeltaRA);

  // Calculate x, y in projection plane
  const x = k * cosDec * Math.sin(deltaRA);
  const y = k * (cosCenterDec * sinDec - sinCenterDec * cosDec * cosDeltaRA);

  // Scale to pixels
  return {
    x: x * scale,
    y: -y * scale, // Flip y-axis for screen coordinates (positive = down)
  };
}

/**
 * Convert Right Ascension to Hour Angle using Local Sidereal Time
 *
 * Hour Angle = LST - RA
 * - Hour Angle is the angle between the meridian and the object
 * - Negative HA: Object is east of meridian (rising)
 * - Positive HA: Object is west of meridian (setting)
 * - HA = 0: Object is on the meridian (highest altitude)
 *
 * @param ra - Right Ascension in degrees
 * @param lst - Local Sidereal Time in hours
 * @returns Hour angle in hours
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
 * Convert Hour Angle to Right Ascension using Local Sidereal Time
 *
 * RA = LST - Hour Angle
 *
 * @param hourAngle - Hour angle in hours
 * @param lst - Local Sidereal Time in hours
 * @returns Right Ascension in degrees
 */
export function hourAngleToRA(hourAngle: number, lst: number): number {
  let ra = (lst - hourAngle) * HOURS_TO_DEG;

  // Normalize to range 0-360 degrees
  while (ra < 0) ra += 360;
  while (ra >= 360) ra -= 360;

  return ra;
}

/**
 * Calculate angular separation between two celestial positions
 *
 * Uses the haversine formula for accurate results at all distances.
 *
 * @param ra1 - RA of first position in degrees
 * @param dec1 - Dec of first position in degrees
 * @param ra2 - RA of second position in degrees
 * @param dec2 - Dec of second position in degrees
 * @returns Angular separation in degrees
 */
export function angularSeparation(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number
): number {
  const ra1Rad = ra1 * DEG_TO_RAD;
  const dec1Rad = dec1 * DEG_TO_RAD;
  const ra2Rad = ra2 * DEG_TO_RAD;
  const dec2Rad = dec2 * DEG_TO_RAD;

  const deltaRA = ra2Rad - ra1Rad;

  // Haversine formula
  const a =
    Math.sin((dec2Rad - dec1Rad) / 2) ** 2 +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(deltaRA / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return c * RAD_TO_DEG;
}

/**
 * Calculate the four corners of a rectangular Field of View
 *
 * Given center position and FOV dimensions, calculate the RA/Dec
 * coordinates of the four corners.
 *
 * @param centerRA - Center RA in degrees
 * @param centerDec - Center Dec in degrees
 * @param fovWidth - FOV width in arcminutes
 * @param fovHeight - FOV height in arcminutes
 * @returns Array of 4 corner positions [{ra, dec}, ...]
 */
export function calculateFOVCorners(
  centerRA: number,
  centerDec: number,
  fovWidth: number,
  fovHeight: number
): Array<{ ra: number; dec: number }> {
  // Convert FOV from arcminutes to degrees
  const halfWidth = (fovWidth / 60) / 2;
  const halfHeight = (fovHeight / 60) / 2;

  // Simple rectangular approximation
  // For small FOVs, this is accurate enough
  // For large FOVs near poles, would need spherical geometry

  const decCorrectionFactor = Math.cos(centerDec * DEG_TO_RAD);

  return [
    {
      // Top-left
      ra: centerRA - halfWidth / decCorrectionFactor,
      dec: centerDec + halfHeight,
    },
    {
      // Top-right
      ra: centerRA + halfWidth / decCorrectionFactor,
      dec: centerDec + halfHeight,
    },
    {
      // Bottom-right
      ra: centerRA + halfWidth / decCorrectionFactor,
      dec: centerDec - halfHeight,
    },
    {
      // Bottom-left
      ra: centerRA - halfWidth / decCorrectionFactor,
      dec: centerDec - halfHeight,
    },
  ];
}

/**
 * Format RA in hours, minutes, seconds
 *
 * @param raDegrees - RA in degrees
 * @returns Formatted string "HHh MMm SS.Ss"
 */
export function formatRA(raDegrees: number): string {
  const raHours = raDegrees / HOURS_TO_DEG;
  const hours = Math.floor(raHours);
  const minutes = Math.floor((raHours - hours) * 60);
  const seconds = ((raHours - hours) * 60 - minutes) * 60;

  return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toFixed(1)}s`;
}

/**
 * Format Dec in degrees, arcminutes, arcseconds
 *
 * @param decDegrees - Dec in degrees
 * @returns Formatted string "+DD° MM' SS.S""
 */
export function formatDec(decDegrees: number): string {
  const sign = decDegrees >= 0 ? '+' : '-';
  const absDec = Math.abs(decDegrees);
  const degrees = Math.floor(absDec);
  const arcminutes = Math.floor((absDec - degrees) * 60);
  const arcseconds = ((absDec - degrees) * 60 - arcminutes) * 60;

  return `${sign}${degrees}° ${arcminutes.toString().padStart(2, '0')}' ${arcseconds.toFixed(1)}"`;
}
