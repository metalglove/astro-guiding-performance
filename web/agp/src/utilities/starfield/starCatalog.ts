export interface Star {
  id: number;
  ra: number;
  dec: number;
  mag: number;
  bv: number;
  name?: string;
}

export interface StarCatalogMetadata {
  catalog: string;
  version: string;
  magnitude_limit: number;
  star_count: number;
  epoch: string;
  description?: string;
}

export interface StarCatalog {
  metadata: StarCatalogMetadata;
  stars: Star[];
}

let cachedCatalog: StarCatalog | null = null;

export async function loadStarCatalog(url: string = '/data/bright-stars.json'): Promise<StarCatalog> {
  if (cachedCatalog) {
    return cachedCatalog;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load star catalog: ${response.statusText}`);
    }
    
    const catalog: StarCatalog = await response.json();
    
    if (!catalog.metadata || !catalog.stars) {
      throw new Error('Invalid star catalog format');
    }
    
    cachedCatalog = catalog;
    return catalog;
  } catch (error) {
    console.error('Error loading star catalog:', error);
    throw error;
  }
}

export function filterStarsByMagnitude(stars: Star[], maxMagnitude: number): Star[] {
  return stars.filter(star => star.mag <= maxMagnitude);
}

export function filterStarsByRegion(
  stars: Star[],
  raMin: number,
  raMax: number,
  decMin: number,
  decMax: number
): Star[] {
  return stars.filter(star => {
    const ra = star.ra;
    const dec = star.dec;
    
    let raInRange: boolean;
    if (raMin <= raMax) {
      raInRange = ra >= raMin && ra <= raMax;
    } else {
      raInRange = ra >= raMin || ra <= raMax;
    }
    
    const decInRange = dec >= decMin && dec <= decMax;
    
    return raInRange && decInRange;
  });
}

export function getStarColor(bv: number): string {
  if (bv < -0.3) return '#9BB0FF';
  if (bv < -0.2) return '#AAC0FF';
  if (bv < -0.15) return '#B8CCFF';
  if (bv < -0.1) return '#C5D8FF';
  if (bv < 0.0) return '#D2E4FF';
  if (bv < 0.1) return '#E0F0FF';
  if (bv < 0.2) return '#EFF9FF';
  if (bv < 0.3) return '#F8F7FF';
  if (bv < 0.4) return '#FFF9F9';
  if (bv < 0.5) return '#FFF5EC';
  if (bv < 0.6) return '#FFF4E8';
  if (bv < 0.8) return '#FFF0D9';
  if (bv < 1.0) return '#FFE9C5';
  if (bv < 1.2) return '#FFE0B0';
  if (bv < 1.4) return '#FFD79B';
  if (bv < 1.6) return '#FFCC6F';
  if (bv < 1.8) return '#FFC04D';
  return '#FFB329';
}

export function getStarSize(magnitude: number, baseSizePx: number = 2.0): number {
  const brightnessScale = Math.pow(2.512, -magnitude / 2.5);
  return Math.max(0.5, baseSizePx * brightnessScale);
}

export function getStarIntensity(magnitude: number): number {
  const brightnessScale = Math.pow(2.512, -magnitude);
  return Math.max(0.1, Math.min(1.0, brightnessScale / 100));
}

export function findStarByName(catalog: StarCatalog, name: string): Star | undefined {
  const lowerName = name.toLowerCase();
  return catalog.stars.find(star => 
    star.name?.toLowerCase() === lowerName
  );
}

export function findBrightestStars(catalog: StarCatalog, count: number = 10): Star[] {
  return [...catalog.stars]
    .sort((a, b) => a.mag - b.mag)
    .slice(0, count);
}

export function getStarsInFOV(
  catalog: StarCatalog,
  centerRA: number,
  centerDec: number,
  fovDegrees: number
): Star[] {
  const fovRadians = (fovDegrees / 2) * Math.PI / 180;
  
  return catalog.stars.filter(star => {
    const raRad = star.ra * 15 * Math.PI / 180;
    const decRad = star.dec * Math.PI / 180;
    const centerRARad = centerRA * 15 * Math.PI / 180;
    const centerDecRad = centerDec * Math.PI / 180;
    
    const angularDist = Math.acos(
      Math.sin(decRad) * Math.sin(centerDecRad) +
      Math.cos(decRad) * Math.cos(centerDecRad) * Math.cos(raRad - centerRARad)
    );
    
    return angularDist <= fovRadians;
  });
}

export function clearCatalogCache(): void {
  cachedCatalog = null;
}
