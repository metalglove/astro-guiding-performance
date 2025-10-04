import { EquipmentState, TelescopeSpecs, CameraSpecs, MountSpecs } from './Equipment.types';

// Preset telescopes with common astrophotography scopes
const presetTelescopes: TelescopeSpecs[] = [
  {
    id: 'newtonian-800-203-f4',
    name: 'Newtonian 800/203 F4',
    type: 'newtonian',
    aperture: 203,
    focalLength: 800,
    focalRatio: 4.0,
    centralObstruction: 20,
    manufacturer: 'Generic',
    model: '8" F4 Newtonian'
  },
  {
    id: 'william-optics-gt81',
    name: 'William Optics GT81',
    type: 'refractor',
    aperture: 81,
    focalLength: 478,
    focalRatio: 5.9,
    manufacturer: 'William Optics',
    model: 'GT81'
  },
  {
    id: 'celestron-rasa-8',
    name: 'Celestron RASA 8',
    type: 'schmidt-cassegrain',
    aperture: 203,
    focalLength: 400,
    focalRatio: 2.0,
    centralObstruction: 34,
    manufacturer: 'Celestron',
    model: 'RASA 8'
  }
];

// Preset cameras with popular astrophotography models
const presetCameras: CameraSpecs[] = [
  {
    id: 'asi2600mm-pro',
    name: 'ASI 2600 MM Pro',
    type: 'imaging',
    manufacturer: 'ZWO',
    model: 'ASI2600MM Pro',
    pixelSize: 3.76,
    width: 6248,
    height: 4176,
    sensorType: 'CMOS',
    cooled: true,
    fullWellCapacity: 50000,
    readNoise: 1.2,
    quantumEfficiency: 90
  },
  {
    id: 'asi2600mc-pro',
    name: 'ASI 2600 MC Pro',
    type: 'imaging',
    manufacturer: 'ZWO',
    model: 'ASI2600MC Pro',
    pixelSize: 3.76,
    width: 6248,
    height: 4176,
    sensorType: 'CMOS',
    cooled: true,
    fullWellCapacity: 50000,
    readNoise: 1.2,
    quantumEfficiency: 90
  },
  {
    id: 'asi294mc-pro',
    name: 'ASI 294 MC Pro',
    type: 'imaging',
    manufacturer: 'ZWO',
    model: 'ASI294MC Pro',
    pixelSize: 4.63,
    width: 4144,
    height: 2822,
    sensorType: 'CMOS',
    cooled: true,
    fullWellCapacity: 63000,
    readNoise: 1.3,
    quantumEfficiency: 85
  },
  {
    id: 'asi224mc',
    name: 'ASI 224 MC',
    type: 'guiding',
    manufacturer: 'ZWO',
    model: 'ASI224MC',
    pixelSize: 3.75,
    width: 1304,
    height: 976,
    sensorType: 'CMOS',
    cooled: false,
    readNoise: 2.5,
    quantumEfficiency: 75
  },
  {
    id: 'asi290mm-mini',
    name: 'ASI 290 MM Mini',
    type: 'guiding',
    manufacturer: 'ZWO',
    model: 'ASI290MM Mini',
    pixelSize: 2.9,
    width: 1936,
    height: 1096,
    sensorType: 'CMOS',
    cooled: false,
    readNoise: 1.5,
    quantumEfficiency: 85
  }
];

// Preset mounts
const presetMounts: MountSpecs[] = [
  {
    id: 'celestron-avx',
    name: 'Celestron AVX',
    manufacturer: 'Celestron',
    model: 'Advanced VX',
    type: 'equatorial',
    payload: 13.6,
    trackingAccuracy: 1.0
  },
  {
    id: 'skywatcher-heq5-pro',
    name: 'Sky-Watcher HEQ5 Pro',
    manufacturer: 'Sky-Watcher',
    model: 'HEQ5 Pro',
    type: 'equatorial',
    payload: 13.5,
    trackingAccuracy: 0.8
  },
  {
    id: 'eq6r-pro',
    name: 'Sky-Watcher EQ6-R Pro',
    manufacturer: 'Sky-Watcher',
    model: 'EQ6-R Pro',
    type: 'equatorial',
    payload: 20,
    trackingAccuracy: 0.5
  }
];

export const equipmentState: EquipmentState = {
  profiles: [],
  activeProfileId: null,
  presetTelescopes,
  presetCameras,
  presetMounts
};
