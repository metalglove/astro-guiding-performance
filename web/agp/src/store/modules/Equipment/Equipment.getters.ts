import { GetterTree } from 'vuex';
import { EquipmentProfile, TelescopeSpecs, CameraSpecs, MountSpecs } from './Equipment.types';
import { RootState } from '../../index';
import { IEquipmentState } from './Equipment.state';
import { 
  calculateTheoreticalResolution, 
  calculateSamplingRatio,
  calculateGuidingAccuracyTarget
} from '../../../utilities/computations';

export enum EquipmentGetterTypes {
  ALL_PROFILES = 'ALL_PROFILES',
  ACTIVE_PROFILE = 'ACTIVE_PROFILE',
  GET_PROFILE_BY_ID = 'GET_PROFILE_BY_ID',
  PRESET_TELESCOPES = 'PRESET_TELESCOPES',
  PRESET_CAMERAS = 'PRESET_CAMERAS',
  PRESET_MOUNTS = 'PRESET_MOUNTS',
  IMAGING_CAMERAS = 'IMAGING_CAMERAS',
  GUIDING_CAMERAS = 'GUIDING_CAMERAS',
  ACTIVE_PIXEL_SCALE = 'ACTIVE_PIXEL_SCALE',
  ACTIVE_FIELD_OF_VIEW = 'ACTIVE_FIELD_OF_VIEW',
  ACTIVE_TELESCOPE = 'ACTIVE_TELESCOPE',
  ACTIVE_IMAGING_CAMERA = 'ACTIVE_IMAGING_CAMERA',
  ACTIVE_GUIDING_CAMERA = 'ACTIVE_GUIDING_CAMERA',
  ACTIVE_MOUNT = 'ACTIVE_MOUNT',
  HAS_PROFILES = 'HAS_PROFILES',
  PROFILE_COUNT = 'PROFILE_COUNT',
  THEORETICAL_RESOLUTION = 'THEORETICAL_RESOLUTION',
  SAMPLING_RATIO = 'SAMPLING_RATIO',
  GUIDING_ACCURACY_TARGET = 'GUIDING_ACCURACY_TARGET'
}

export interface EquipmentGetters {
  [EquipmentGetterTypes.ALL_PROFILES](state: IEquipmentState): EquipmentProfile[];
  [EquipmentGetterTypes.ACTIVE_PROFILE](state: IEquipmentState): EquipmentProfile | null;
  [EquipmentGetterTypes.GET_PROFILE_BY_ID](state: IEquipmentState): (id: string) => EquipmentProfile | null;
  [EquipmentGetterTypes.PRESET_TELESCOPES](state: IEquipmentState): TelescopeSpecs[];
  [EquipmentGetterTypes.PRESET_CAMERAS](state: IEquipmentState): CameraSpecs[];
  [EquipmentGetterTypes.PRESET_MOUNTS](state: IEquipmentState): MountSpecs[];
  [EquipmentGetterTypes.IMAGING_CAMERAS](state: IEquipmentState): CameraSpecs[];
  [EquipmentGetterTypes.GUIDING_CAMERAS](state: IEquipmentState): CameraSpecs[];
  [EquipmentGetterTypes.ACTIVE_PIXEL_SCALE](state: IEquipmentState, getters: any): number | null;
  [EquipmentGetterTypes.ACTIVE_FIELD_OF_VIEW](state: IEquipmentState, getters: any): { width: number; height: number } | null;
  [EquipmentGetterTypes.ACTIVE_TELESCOPE](state: IEquipmentState, getters: any): TelescopeSpecs | null;
  [EquipmentGetterTypes.ACTIVE_IMAGING_CAMERA](state: IEquipmentState, getters: any): CameraSpecs | null;
  [EquipmentGetterTypes.ACTIVE_GUIDING_CAMERA](state: IEquipmentState, getters: any): CameraSpecs | null;
  [EquipmentGetterTypes.ACTIVE_MOUNT](state: IEquipmentState, getters: any): MountSpecs | null;
  [EquipmentGetterTypes.HAS_PROFILES](state: IEquipmentState): boolean;
  [EquipmentGetterTypes.PROFILE_COUNT](state: IEquipmentState): number;
  [EquipmentGetterTypes.THEORETICAL_RESOLUTION](state: IEquipmentState, getters: any): number | null;
  [EquipmentGetterTypes.SAMPLING_RATIO](state: IEquipmentState, getters: any): number | null;
  [EquipmentGetterTypes.GUIDING_ACCURACY_TARGET](state: IEquipmentState, getters: any): number | null;
}

export const equipmentGetters: GetterTree<IEquipmentState, RootState> & EquipmentGetters = {
  // Profile getters
  [EquipmentGetterTypes.ALL_PROFILES]: (state): EquipmentProfile[] => state.profiles,

  [EquipmentGetterTypes.ACTIVE_PROFILE]: (state): EquipmentProfile | null => {
    if (!state.activeProfileId) return null;
    return state.profiles.find(p => p.id === state.activeProfileId) || null;
  },

  [EquipmentGetterTypes.GET_PROFILE_BY_ID]: (state) => (id: string): EquipmentProfile | null => {
    return state.profiles.find(p => p.id === id) || null;
  },

  // Equipment presets
  [EquipmentGetterTypes.PRESET_TELESCOPES]: (state) => state.presetTelescopes,
  [EquipmentGetterTypes.PRESET_CAMERAS]: (state) => state.presetCameras,
  [EquipmentGetterTypes.PRESET_MOUNTS]: (state) => state.presetMounts,

  // Filter presets by type
  [EquipmentGetterTypes.IMAGING_CAMERAS]: (state) => state.presetCameras.filter(c => c.type === 'imaging'),
  [EquipmentGetterTypes.GUIDING_CAMERAS]: (state) => state.presetCameras.filter(c => c.type === 'guiding'),

  // Calculated properties for active profile
  [EquipmentGetterTypes.ACTIVE_PIXEL_SCALE]: (state, getters): number | null => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.pixelScale || null;
  },

  [EquipmentGetterTypes.ACTIVE_FIELD_OF_VIEW]: (state, getters): { width: number; height: number } | null => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.fieldOfView || null;
  },

  [EquipmentGetterTypes.ACTIVE_TELESCOPE]: (state, getters) => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.telescope || null;
  },

  [EquipmentGetterTypes.ACTIVE_IMAGING_CAMERA]: (state, getters) => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.imagingCamera || null;
  },

  [EquipmentGetterTypes.ACTIVE_GUIDING_CAMERA]: (state, getters) => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.guidingCamera || null;
  },

  [EquipmentGetterTypes.ACTIVE_MOUNT]: (state, getters) => {
    const profile = getters[EquipmentGetterTypes.ACTIVE_PROFILE] as EquipmentProfile | null;
    return profile?.mount || null;
  },

  // Utility getters
  [EquipmentGetterTypes.HAS_PROFILES]: (state): boolean => state.profiles.length > 0,
  [EquipmentGetterTypes.PROFILE_COUNT]: (state): number => state.profiles.length,

  // Calculate theoretical performance metrics
  [EquipmentGetterTypes.THEORETICAL_RESOLUTION]: (state, getters): number | null => {
    const telescope = getters[EquipmentGetterTypes.ACTIVE_TELESCOPE];
    if (!telescope) return null;

    return calculateTheoreticalResolution(telescope.aperture);
  },

  [EquipmentGetterTypes.SAMPLING_RATIO]: (state, getters): number | null => {
    const pixelScale = getters[EquipmentGetterTypes.ACTIVE_PIXEL_SCALE];
    const resolution = getters[EquipmentGetterTypes.THEORETICAL_RESOLUTION];

    if (!pixelScale || !resolution) return null;

    return calculateSamplingRatio(pixelScale, resolution);
  },

  [EquipmentGetterTypes.GUIDING_ACCURACY_TARGET]: (state, getters): number | null => {
    const pixelScale = getters[EquipmentGetterTypes.ACTIVE_PIXEL_SCALE];
    if (!pixelScale) return null;

    return calculateGuidingAccuracyTarget(pixelScale);
  }
};
