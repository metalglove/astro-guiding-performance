export interface DeepSkyObject {
  id: string;
  name: string;
  type: 'Galaxy' | 'Emission Nebula' | 'Planetary Nebula' | 'Supernova Remnant' | 'Open Cluster' | 'Globular Cluster';
  constellation: string;
  ra: number;
  dec: number;
  magnitude: number;
  size: number;
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface TargetCategory {
  name: string;
  description: string;
  targets: DeepSkyObject[];
}

import messierCatalog from './messier-catalog.json';

export const MESSIER_CATALOG: DeepSkyObject[] = messierCatalog as DeepSkyObject[];

export function getTargetsByType(type: DeepSkyObject['type']): DeepSkyObject[] {
  return MESSIER_CATALOG.filter(target => target.type === type);
}

export function getTargetsBySeason(season: DeepSkyObject['season']): DeepSkyObject[] {
  return MESSIER_CATALOG.filter(target => target.season === season);
}

export function getTargetsByDifficulty(difficulty: DeepSkyObject['difficulty']): DeepSkyObject[] {
  return MESSIER_CATALOG.filter(target => target.difficulty === difficulty);
}

export function getTargetsByConstellation(constellation: string): DeepSkyObject[] {
  return MESSIER_CATALOG.filter(target => 
    target.constellation.toLowerCase() === constellation.toLowerCase()
  );
}

export function searchTargets(query: string): DeepSkyObject[] {
  const lowerQuery = query.toLowerCase();
  return MESSIER_CATALOG.filter(target =>
    target.id.toLowerCase().includes(lowerQuery) ||
    target.name.toLowerCase().includes(lowerQuery) ||
    target.constellation.toLowerCase().includes(lowerQuery)
  );
}

export function getTargetById(id: string): DeepSkyObject | undefined {
  return MESSIER_CATALOG.find(target => 
    target.id.toLowerCase() === id.toLowerCase()
  );
}

export const TARGET_CATEGORIES: TargetCategory[] = [
  {
    name: 'Galaxies',
    description: 'Spiral, elliptical, and irregular galaxies',
    targets: getTargetsByType('Galaxy')
  },
  {
    name: 'Nebulae',
    description: 'Emission, planetary, and supernova remnant nebulae',
    targets: [
      ...getTargetsByType('Emission Nebula'),
      ...getTargetsByType('Planetary Nebula'),
      ...getTargetsByType('Supernova Remnant')
    ]
  },
  {
    name: 'Clusters',
    description: 'Open and globular star clusters',
    targets: [
      ...getTargetsByType('Open Cluster'),
      ...getTargetsByType('Globular Cluster')
    ]
  }
];

export const SEASONAL_TARGETS: Record<string, DeepSkyObject[]> = {
  'Winter': getTargetsBySeason('Winter'),
  'Spring': getTargetsBySeason('Spring'),
  'Summer': getTargetsBySeason('Summer'),
  'Fall': getTargetsBySeason('Fall')
};

export const BEGINNER_TARGETS = getTargetsByDifficulty('Easy');
export const INTERMEDIATE_TARGETS = getTargetsByDifficulty('Moderate');
export const ADVANCED_TARGETS = getTargetsByDifficulty('Hard');
