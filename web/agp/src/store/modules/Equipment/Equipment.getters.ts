import { GetterTree } from 'vuex';
import { EquipmentState, EquipmentProfile } from './Equipment.types';
import { RootState } from '../../index';

export const equipmentGetters: GetterTree<EquipmentState, RootState> = {
  // Profile getters
  allProfiles: (state): EquipmentProfile[] => state.profiles,
  
  activeProfile: (state): EquipmentProfile | null => {
    if (!state.activeProfileId) return null;
    return state.profiles.find(p => p.id === state.activeProfileId) || null;
  },

  getProfileById: (state) => (id: string): EquipmentProfile | null => {
    return state.profiles.find(p => p.id === id) || null;
  },

  // Equipment presets
  presetTelescopes: (state) => state.presetTelescopes,
  presetCameras: (state) => state.presetCameras,
  presetMounts: (state) => state.presetMounts,

  // Filter presets by type
  imagingCameras: (state) => state.presetCameras.filter(c => c.type === 'imaging'),
  guidingCameras: (state) => state.presetCameras.filter(c => c.type === 'guiding'),

  // Calculated properties for active profile
  activePixelScale: (state, getters): number | null => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.pixelScale || null;
  },

  activeFieldOfView: (state, getters): { width: number; height: number } | null => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.fieldOfView || null;
  },

  activeTelescope: (state, getters) => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.telescope || null;
  },

  activeImagingCamera: (state, getters) => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.imagingCamera || null;
  },

  activeGuidingCamera: (state, getters) => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.guidingCamera || null;
  },

  activeMount: (state, getters) => {
    const profile = getters.activeProfile as EquipmentProfile | null;
    return profile?.mount || null;
  },

  // Utility getters
  hasProfiles: (state): boolean => state.profiles.length > 0,
  profileCount: (state): number => state.profiles.length,

  // Calculate theoretical performance metrics
  theoreticalResolution: (state, getters): number | null => {
    const telescope = getters.activeTelescope;
    if (!telescope) return null;
    
    // Dawes limit in arcseconds: 4.56 / aperture_in_inches
    const apertureInches = telescope.aperture / 25.4;
    return 4.56 / apertureInches;
  },

  samplingRatio: (state, getters): number | null => {
    const pixelScale = getters.activePixelScale;
    const resolution = getters.theoreticalResolution;
    
    if (!pixelScale || !resolution) return null;
    
    // Nyquist sampling ratio (should be around 2.0 for optimal sampling)
    return pixelScale / (resolution / 2);
  },

  guidingAccuracyTarget: (state, getters): number | null => {
    const pixelScale = getters.activePixelScale;
    if (!pixelScale) return null;
    
    // Target guiding accuracy: 1/3 of pixel scale for sharp stars
    return pixelScale / 3;
  }
};
