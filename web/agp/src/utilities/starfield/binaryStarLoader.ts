/**
 * Filename: binaryStarLoader.ts
 * Purpose: Load binary star catalog format (little-endian packed structs)
 * Created: January 7, 2026
 * Last Modified: January 7, 2026
 */

import { Star, StarCatalog } from './starCatalog';

export interface BinaryStar {
  ra: number;
  dec: number;
  mag: number;
  bv: number;
}

export interface BinaryStarCatalog {
  header: BinaryHeader;
  stars: Float32Array;
  starsCount: number;
  namedStars: Map<number, string>;
}

export interface BinaryHeader {
  magic: string;
  version: number;
  starCount: number;
  magLimit: number;
  epoch: string;
}

const HEADER_SIZE = 52;
const STAR_DATA_SIZE = 16;

export function parseBinaryStarCatalog(arrayBuffer: ArrayBuffer): BinaryStarCatalog {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  if (arrayBuffer.byteLength < 52) {
    throw new Error(`Buffer too small: ${arrayBuffer.byteLength} bytes, expected at least 52 for header`);
  }

  const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset, 4));
  offset += 4;

  if (magic !== 'HYGB') {
    throw new Error(`Invalid magic number: ${magic}`);
  }

  const magLimit = view.getFloat32(offset, true);
  offset += 4;

  const version = view.getUint32(offset, true);
  offset += 4;

  const starCount = view.getUint32(offset, true);
  offset += 4;

  if (arrayBuffer.byteLength < offset + 24) {
    throw new Error(`Buffer too small for epoch: need ${offset + 24} bytes, have ${arrayBuffer.byteLength}`);
  }

  const epoch = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset, 24));
  offset += 24;

  const header: BinaryHeader = {
    magic,
    version,
    starCount,
    magLimit,
    epoch
  };

  const stars = new Float32Array(arrayBuffer, offset, starCount * 4);
  offset += starCount * 4 * 4;

  const nameCount = view.getUint32(offset, true);
  offset += 4;

  const namedStars = new Map<number, string>();

  for (let i = 0; i < nameCount; i++) {
    const starId = view.getUint32(offset, true);
    offset += 4;

    const nameLength = view.getUint16(offset, true);
    offset += 2;

    const nameBytes = new Uint8Array(arrayBuffer, offset, nameLength);
    const name = new TextDecoder().decode(nameBytes);
    offset += nameLength;

    namedStars.set(starId, name);
  }

  return {
    header,
    stars,
    starsCount: starCount,
    namedStars
  };
}

export function binaryToStarCatalog(binary: BinaryStarCatalog): StarCatalog {
  const stars: Star[] = [];
  const starData = binary.stars;

  console.log('[binaryStarLoader] Converting star data:', 'count=', binary.starsCount);

  for (let i = 0; i < binary.starsCount; i++) {
    const offset = i * 4;
    const ra = starData[offset];
    const dec = starData[offset + 1];
    const mag = starData[offset + 2];
    const bv = starData[offset + 3];

    const star: Star = {
      id: i,
      ra,
      dec,
      mag,
      bv,
      name: undefined
    };

    stars.push(star);
  }

  const catalog: StarCatalog = {
    metadata: {
      catalog: 'HYG Binary',
      version: `${binary.header.version}`,
      magnitude_limit: binary.header.magLimit,
      star_count: binary.starsCount,
      epoch: binary.header.epoch,
      description: 'HYG v4.2 catalog converted to binary format'
    },
    stars
  };

  return catalog;
}

let cachedBinaryCatalog: BinaryStarCatalog | null = null;

export async function loadBinaryStarCatalog(url: string = '/data/hygdata.bin'): Promise<StarCatalog> {
  console.log('[binaryStarLoader] Loading catalog from:', url);

  if (cachedBinaryCatalog) {
    console.log('[binaryStarLoader] Using cached catalog');
    return binaryToStarCatalog(cachedBinaryCatalog);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load star catalog: ${response.statusText} (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('[binaryStarLoader] Loaded', arrayBuffer.byteLength, 'bytes');

    cachedBinaryCatalog = parseBinaryStarCatalog(arrayBuffer);
    console.log('[binaryStarLoader] Parsed', cachedBinaryCatalog.starsCount, 'stars');

    const catalog = binaryToStarCatalog(cachedBinaryCatalog);
    console.log('[binaryStarLoader] Converted to StarCatalog with', catalog.stars.length, 'stars');

    return catalog;
  } catch (error) {
    console.error('[binaryStarLoader] Error loading binary star catalog:', error);
    throw error;
  }
}

export function clearBinaryCatalogCache(): void {
  cachedBinaryCatalog = null;
}
