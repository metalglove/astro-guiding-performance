import { MutationTree } from 'vuex';
import { EquipmentState, EquipmentProfile } from './Equipment.types';

export const equipmentMutations: MutationTree<EquipmentState> = {
  ADD_PROFILE(state, profile: EquipmentProfile) {
    state.profiles.push(profile);
  },

  UPDATE_PROFILE(state, updates: Partial<EquipmentProfile> & { id: string }) {
    const index = state.profiles.findIndex(p => p.id === updates.id);
    if (index !== -1) {
      const existingProfile = state.profiles[index];
      const updatedProfile = { ...existingProfile, ...updates };
      
      // Recalculate pixel scale and field of view if telescope or imaging camera changed
      if (updates.telescope || updates.imagingCamera) {
        const telescope = updates.telescope || existingProfile.telescope;
        const camera = updates.imagingCamera || existingProfile.imagingCamera;
        
        if (telescope.focalLength && camera.pixelSize) {
          updatedProfile.pixelScale = (camera.pixelSize * 206.265) / telescope.focalLength;
          updatedProfile.fieldOfView = {
            width: (camera.width * updatedProfile.pixelScale) / 60,
            height: (camera.height * updatedProfile.pixelScale) / 60
          };
        }
      }
      
      state.profiles.splice(index, 1, updatedProfile);
    }
  },

  REMOVE_PROFILE(state, id: string) {
    const index = state.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      state.profiles.splice(index, 1);
      // If removing active profile, clear active profile
      if (state.activeProfileId === id) {
        state.activeProfileId = null;
      }
    }
  },

  SET_ACTIVE_PROFILE(state, id: string | null) {
    state.activeProfileId = id;
  },

  LOAD_PROFILES_FROM_STORAGE(state, profiles: EquipmentProfile[]) {
    state.profiles = profiles;
  },

  CLEAR_PROFILES(state) {
    state.profiles = [];
    state.activeProfileId = null;
  }
};
