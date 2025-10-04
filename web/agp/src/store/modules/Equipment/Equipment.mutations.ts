import { MutationTree } from 'vuex';
import { EquipmentProfile } from './Equipment.types';
import { IEquipmentState } from './Equipment.state';
import { calculatePixelScale, calculateFieldOfView } from '../../../utilities/computations';

export enum EquipmentMutationTypes {
  ADD_PROFILE = 'ADD_PROFILE',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  REMOVE_PROFILE = 'REMOVE_PROFILE',
  SET_ACTIVE_PROFILE = 'SET_ACTIVE_PROFILE',
  LOAD_PROFILES_FROM_STORAGE = 'LOAD_PROFILES_FROM_STORAGE',
  CLEAR_PROFILES = 'CLEAR_PROFILES'
}

export interface EquipmentMutations {
  [EquipmentMutationTypes.ADD_PROFILE](state: IEquipmentState, profile: EquipmentProfile): void;
  [EquipmentMutationTypes.UPDATE_PROFILE](state: IEquipmentState, updates: Partial<EquipmentProfile> & { id: string }): void;
  [EquipmentMutationTypes.REMOVE_PROFILE](state: IEquipmentState, id: string): void;
  [EquipmentMutationTypes.SET_ACTIVE_PROFILE](state: IEquipmentState, id: string | null): void;
  [EquipmentMutationTypes.LOAD_PROFILES_FROM_STORAGE](state: IEquipmentState, profiles: EquipmentProfile[]): void;
  [EquipmentMutationTypes.CLEAR_PROFILES](state: IEquipmentState): void;
}

export const equipmentMutations: MutationTree<IEquipmentState> & EquipmentMutations = {
  [EquipmentMutationTypes.ADD_PROFILE](state, profile: EquipmentProfile) {
    const profiles = [...state.profiles, profile];
    state.profiles = profiles;
  },

  [EquipmentMutationTypes.UPDATE_PROFILE](state, updates: Partial<EquipmentProfile> & { id: string }) {
    const profiles = [...state.profiles];
    const index = profiles.findIndex(p => p.id === updates.id);
    if (index !== -1) {
      const existingProfile = profiles[index];
      const updatedProfile = { ...existingProfile, ...updates };

      // Recalculate pixel scale and field of view if telescope or imaging camera changed
      if (updates.telescope || updates.imagingCamera) {
        const telescope = updates.telescope || existingProfile.telescope;
        const camera = updates.imagingCamera || existingProfile.imagingCamera;

        if (telescope.focalLength && camera.pixelSize) {
          updatedProfile.pixelScale = calculatePixelScale(camera.pixelSize, telescope.focalLength);
          updatedProfile.fieldOfView = {
            width: calculateFieldOfView(camera.width, updatedProfile.pixelScale),
            height: calculateFieldOfView(camera.height, updatedProfile.pixelScale)
          };
        }
      }

      profiles[index] = updatedProfile;
      state.profiles = profiles;
    }
  },

  [EquipmentMutationTypes.REMOVE_PROFILE](state, id: string) {
    const profiles = state.profiles.filter(p => p.id !== id);
    state.profiles = profiles;
    // If removing active profile, clear active profile
    if (state.activeProfileId === id) {
      state.activeProfileId = null;
    }
  },

  [EquipmentMutationTypes.SET_ACTIVE_PROFILE](state, id: string | null) {
    state.activeProfileId = id;
  },

  [EquipmentMutationTypes.LOAD_PROFILES_FROM_STORAGE](state, profiles: EquipmentProfile[]) {
    state.profiles = profiles;
  },

  [EquipmentMutationTypes.CLEAR_PROFILES](state) {
    state.profiles = [];
    state.activeProfileId = null;
  }
};
