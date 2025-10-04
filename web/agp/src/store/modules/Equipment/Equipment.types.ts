export interface TelescopeSpecs {
  id: string;
  name: string;
  type: 'newtonian' | 'refractor' | 'schmidt-cassegrain' | 'maksutov' | 'ritchey-chretien' | 'other';
  aperture: number; // mm
  focalLength: number; // mm
  focalRatio: number; // f/ratio
  centralObstruction?: number; // percentage
  manufacturer?: string;
  model?: string;
  notes?: string;
}

export interface CameraSpecs {
  id: string;
  name: string;
  type: 'imaging' | 'guiding';
  manufacturer: string;
  model: string;
  pixelSize: number; // micrometers
  width: number; // pixels
  height: number; // pixels
  sensorType: 'CCD' | 'CMOS';
  cooled: boolean;
  fullWellCapacity?: number; // electrons
  readNoise?: number; // electrons RMS
  darkCurrent?: number; // electrons/pixel/second at 0°C
  quantumEfficiency?: number; // percentage
  notes?: string;
}

export interface MountSpecs {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: 'equatorial' | 'alt-azimuth' | 'fork';
  payload: number; // kg
  trackingAccuracy?: number; // arcseconds RMS
  notes?: string;
}

export interface AccessorySpecs {
  id: string;
  name: string;
  type: 'filter-wheel' | 'focuser' | 'field-flattener' | 'reducer' | 'other';
  manufacturer?: string;
  model?: string;
  focalReduction?: number; // multiplier (e.g., 0.67 for reducer)
  notes?: string;
}

export interface EquipmentProfile {
  id: string;
  name: string;
  description: string;
  telescope: TelescopeSpecs;
  imagingCamera: CameraSpecs;
  guidingCamera?: CameraSpecs;
  mount: MountSpecs;
  accessories: AccessorySpecs[];
  pixelScale?: number; // calculated arcsec/pixel
  fieldOfView?: {
    width: number; // arcminutes
    height: number; // arcminutes
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentState {
  profiles: EquipmentProfile[];
  activeProfileId: string | null;
  presetTelescopes: TelescopeSpecs[];
  presetCameras: CameraSpecs[];
  presetMounts: MountSpecs[];
}
