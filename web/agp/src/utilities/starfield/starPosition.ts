import * as THREE from 'three';
import { Star } from './starCatalog';
import { ObserverLocation, calculateAltAz, julianDate, localSiderealTime } from '../astronomy/coordinates';

export interface StarScreenPosition {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

export function raDecToVector3(ra: number, dec: number, distance: number = 1000): THREE.Vector3 {
  const raRad = ra * 15 * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  
  const x = distance * Math.cos(decRad) * Math.cos(raRad);
  const y = distance * Math.sin(decRad);
  const z = -distance * Math.cos(decRad) * Math.sin(raRad);
  
  return new THREE.Vector3(x, y, z);
}

export function altAzToVector3(altitude: number, azimuth: number, distance: number = 1000): THREE.Vector3 {
  const altRad = altitude * Math.PI / 180;
  const azRad = azimuth * Math.PI / 180;
  
  const x = distance * Math.cos(altRad) * Math.sin(azRad);
  const y = distance * Math.sin(altRad);
  const z = -distance * Math.cos(altRad) * Math.cos(azRad);
  
  return new THREE.Vector3(x, y, z);
}

export function starToLocalCoordinates(
  star: Star,
  location: ObserverLocation,
  datetime: Date
): { altitude: number; azimuth: number } {
  return calculateAltAz(
    { ra: star.ra, dec: star.dec },
    location,
    datetime
  );
}

export function createStarPositions(
  stars: Star[],
  location: ObserverLocation,
  datetime: Date,
  distance: number = 1000
): THREE.Vector3[] {
  return stars.map(star => {
    const { altitude, azimuth } = starToLocalCoordinates(star, location, datetime);
    return altAzToVector3(altitude, azimuth, distance);
  });
}

export function createCelestialSpherePositions(
  stars: Star[],
  distance: number = 1000
): THREE.Vector3[] {
  return stars.map(star => raDecToVector3(star.ra, star.dec, distance));
}

export function projectStarToScreen(
  star: Star,
  camera: THREE.Camera,
  canvasWidth: number,
  canvasHeight: number,
  location: ObserverLocation,
  datetime: Date
): StarScreenPosition | null {
  const { altitude, azimuth } = starToLocalCoordinates(star, location, datetime);
  
  if (altitude < 0) {
    return null;
  }
  
  const position = altAzToVector3(altitude, azimuth, 1000);
  
  const projectedPosition = position.clone().project(camera);
  
  const x = (projectedPosition.x + 1) / 2 * canvasWidth;
  const y = -(projectedPosition.y - 1) / 2 * canvasHeight;
  const z = projectedPosition.z;
  
  const visible = z >= -1 && z <= 1;
  
  return { x, y, z, visible };
}

export function rotateStarFieldByTime(
  positions: THREE.Vector3[],
  hourAngle: number
): THREE.Vector3[] {
  const angleRad = hourAngle * 15 * Math.PI / 180;
  const rotationMatrix = new THREE.Matrix4().makeRotationY(angleRad);
  
  return positions.map(pos => pos.clone().applyMatrix4(rotationMatrix));
}

export function getHourAngleRotation(location: ObserverLocation, datetime: Date): number {
  const jd = julianDate(datetime);
  const lst = localSiderealTime(jd, location.longitude);
  return lst;
}

export function createStarGeometry(stars: Star[], positions: THREE.Vector3[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  const positionsArray = new Float32Array(stars.length * 3);
  const colorsArray = new Float32Array(stars.length * 3);
  const sizesArray = new Float32Array(stars.length);
  
  for (let i = 0; i < stars.length; i++) {
    const pos = positions[i];
    positionsArray[i * 3] = pos.x;
    positionsArray[i * 3 + 1] = pos.y;
    positionsArray[i * 3 + 2] = pos.z;
    
    const color = new THREE.Color(getStarColorHex(stars[i].bv));
    colorsArray[i * 3] = color.r;
    colorsArray[i * 3 + 1] = color.g;
    colorsArray[i * 3 + 2] = color.b;
    
    sizesArray[i] = Math.max(1.0, Math.pow(2.512, -stars[i].mag / 2.5) * 5);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));
  
  return geometry;
}

function getStarColorHex(bv: number): number {
  if (bv < -0.3) return 0x9BB0FF;
  if (bv < -0.2) return 0xAAC0FF;
  if (bv < -0.15) return 0xB8CCFF;
  if (bv < -0.1) return 0xC5D8FF;
  if (bv < 0.0) return 0xD2E4FF;
  if (bv < 0.1) return 0xE0F0FF;
  if (bv < 0.2) return 0xEFF9FF;
  if (bv < 0.3) return 0xF8F7FF;
  if (bv < 0.4) return 0xFFF9F9;
  if (bv < 0.5) return 0xFFF5EC;
  if (bv < 0.6) return 0xFFF4E8;
  if (bv < 0.8) return 0xFFF0D9;
  if (bv < 1.0) return 0xFFE9C5;
  if (bv < 1.2) return 0xFFE0B0;
  if (bv < 1.4) return 0xFFD79B;
  if (bv < 1.6) return 0xFFCC6F;
  if (bv < 1.8) return 0xFFC04D;
  return 0xFFB329;
}
