/**
 * Filename: starfieldRenderer.ts
 * Purpose: Three.js star field rendering system for telescope camera view
 * Created: January 7, 2026
 * Last Modified: January 7, 2026
 */

import * as THREE from 'three';
import { Star, StarCatalog } from './starCatalog';
import { raDecToVector3 } from './starPosition';

export interface StarFieldOptions {
  /** Distance to place stars from origin (default: 500) */
  sphereRadius?: number;
  /** Base size multiplier for stars (default: 8) */
  baseSizeMultiplier?: number;
  /** Minimum star size in pixels (default: 2) */
  minStarSize?: number;
  /** Maximum star size in pixels (default: 30) */
  maxStarSize?: number;
  /** Enable glow effect on bright stars (default: true) */
  enableGlow?: boolean;
}

const DEFAULT_OPTIONS: Required<StarFieldOptions> = {
  sphereRadius: 500,
  baseSizeMultiplier: 8,
  minStarSize: 2,
  maxStarSize: 30,
  enableGlow: true
};

/**
 * Calculate star visual size based on apparent magnitude
 * Uses the astronomical brightness scale: mag difference of 5 = 100x brightness
 */
function calculateStarSize(magnitude: number, options: Required<StarFieldOptions>): number {
  // Sirius (mag -1.46) should be largest, faint stars (mag 3) smallest
  // Brightness ratio = 2.512^(-magnitude)
  const brightnessScale = Math.pow(2.512, -magnitude / 2.5);
  const size = options.baseSizeMultiplier * brightnessScale;
  return Math.max(options.minStarSize, Math.min(options.maxStarSize, size));
}

/**
 * Get star color based on B-V color index
 * Blue stars (B-V < 0) -> White stars (B-V ~0.3) -> Red stars (B-V > 1.0)
 */
function getStarColorHex(bv: number): number {
  // Blue-white to red color mapping based on stellar B-V index
  if (bv < -0.3) return 0x9BB0FF;  // O-type (blue)
  if (bv < -0.2) return 0xAAC0FF;
  if (bv < -0.1) return 0xC5D8FF;  // B-type (blue-white)
  if (bv < 0.0) return 0xD2E4FF;
  if (bv < 0.15) return 0xEFF9FF;  // A-type (white)
  if (bv < 0.3) return 0xF8F7FF;
  if (bv < 0.5) return 0xFFF4E8;   // F-type (yellow-white)
  if (bv < 0.8) return 0xFFE9C5;   // G-type (yellow, like Sun)
  if (bv < 1.0) return 0xFFE0B0;   // K-type (orange)
  if (bv < 1.4) return 0xFFCC6F;
  return 0xFFB329;                  // M-type (red)
}

/**
 * Custom shader material for rendering stars with proper size attenuation
 */
function createStarMaterial(): THREE.ShaderMaterial {
  const vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    varying float vSize;
    
    void main() {
      vColor = customColor;
      vSize = size;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Size attenuation: stars appear smaller when further from camera
      // But we want stars on celestial sphere to have consistent apparent size
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    varying float vSize;
    
    void main() {
      // Create circular point with soft edge (glow effect)
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      // Soft falloff for glow effect
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Brighter center for larger stars
      float coreBrightness = 1.0 - smoothstep(0.0, 0.2, dist);
      vec3 finalColor = vColor + vec3(coreBrightness * 0.3);
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

/**
 * Creates a Three.js Points object representing the star field
 * Stars are positioned on a celestial sphere using RA/Dec coordinates
 */
export function createStarField(
  catalog: StarCatalog,
  options: StarFieldOptions = {}
): THREE.Points {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stars = catalog.stars;
  
  // Create geometry
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  const sizes = new Float32Array(stars.length);
  
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    
    // Convert RA/Dec to 3D position on celestial sphere
    // RA is in hours (0-24), convert to degrees for raDecToVector3
    const pos = raDecToVector3(star.ra, star.dec, opts.sphereRadius);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    
    // Color based on B-V index
    const color = new THREE.Color(getStarColorHex(star.bv));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    // Size based on magnitude
    sizes[i] = calculateStarSize(star.mag, opts);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  // Create material and points
  const material = createStarMaterial();
  const points = new THREE.Points(geometry, material);
  points.name = 'starField';
  
  return points;
}

/**
 * Updates star field rotation based on telescope pointing (RA/Dec)
 * This rotates the celestial sphere to match what the telescope should see
 * 
 * @param starField - The Three.js Points object
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 */
export function updateStarFieldRotation(
  starField: THREE.Points,
  ra: number,
  dec: number
): void {
  // The celestial sphere should rotate so that the target RA/Dec
  // appears at the center of the camera view
  
  // Convert RA to radians (RA increases eastward)
  const raRad = (ra * Math.PI) / 180;
  // Convert Dec to radians
  const decRad = (dec * Math.PI) / 180;
  
  // Reset rotation
  starField.rotation.set(0, 0, 0);
  
  // Rotate around Y-axis (RA rotation) - negative because we're rotating the sphere
  starField.rotation.y = -raRad;
  
  // Rotate around X-axis (Dec rotation)
  starField.rotation.x = decRad;
}

/**
 * Creates star labels for bright named stars
 * Returns a group containing sprite labels
 */
export function createStarLabels(
  catalog: StarCatalog,
  options: StarFieldOptions = {}
): THREE.Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const labelGroup = new THREE.Group();
  labelGroup.name = 'starLabels';
  
  // Only label named stars brighter than magnitude 2.0
  const labeledStars = catalog.stars.filter(
    star => star.name && star.mag <= 2.0
  );
  
  for (const star of labeledStars) {
    const pos = raDecToVector3(star.ra, star.dec, opts.sphereRadius * 0.95);
    
    // Create canvas for label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '24px Arial';
    context.fillStyle = 'rgba(200, 200, 255, 0.8)';
    context.textAlign = 'center';
    context.fillText(star.name || '', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(pos);
    sprite.scale.set(40, 10, 1);
    sprite.userData = { starName: star.name, starId: star.id };
    
    labelGroup.add(sprite);
  }
  
  return labelGroup;
}

/**
 * Find the star closest to a given RA/Dec position
 */
export function findNearestStar(
  catalog: StarCatalog,
  ra: number,
  dec: number,
  maxDistanceDegrees: number = 5
): Star | null {
  let nearest: Star | null = null;
  let minDist = maxDistanceDegrees;
  
  for (const star of catalog.stars) {
    // Simple angular distance approximation
    const dRa = (star.ra - ra) * Math.cos(dec * Math.PI / 180);
    const dDec = star.dec - dec;
    const dist = Math.sqrt(dRa * dRa + dDec * dDec);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = star;
    }
  }
  
  return nearest;
}

/**
 * Dispose of star field resources
 */
export function disposeStarField(starField: THREE.Points): void {
  if (starField.geometry) {
    starField.geometry.dispose();
  }
  if (starField.material) {
    if (Array.isArray(starField.material)) {
      starField.material.forEach(m => m.dispose());
    } else {
      starField.material.dispose();
    }
  }
}

/**
 * Dispose of star labels resources
 */
export function disposeStarLabels(labelGroup: THREE.Group): void {
  labelGroup.traverse((child) => {
    if (child instanceof THREE.Sprite) {
      if (child.material.map) {
        child.material.map.dispose();
      }
      child.material.dispose();
    }
  });
  labelGroup.clear();
}
