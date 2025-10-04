import { ActionTree, ActionContext } from 'vuex';
import { EquipmentProfile, TelescopeSpecs, CameraSpecs, MountSpecs } from './Equipment.types';
import { RootState } from '../../index';
import { EquipmentMutations, EquipmentMutationTypes } from './Equipment.mutations';
import { IEquipmentState } from './Equipment.state';

export enum EquipmentActionTypes {
  CREATE_PROFILE = 'CREATE_PROFILE',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  DELETE_PROFILE = 'DELETE_PROFILE',
  SET_ACTIVE_PROFILE = 'SET_ACTIVE_PROFILE',
  CREATE_PROFILE_FROM_LOGS = 'CREATE_PROFILE_FROM_LOGS',
  ENSURE_EXAMPLE_PROFILE = 'ENSURE_EXAMPLE_PROFILE',
  EXPORT_PROFILES = 'EXPORT_PROFILES',
  IMPORT_PROFILES = 'IMPORT_PROFILES'
}

type AugmentedEquipmentActionContext = {
  commit<K extends keyof EquipmentMutations>(
    key: K,
    payload: Parameters<EquipmentMutations[K]>[1]
  ): ReturnType<EquipmentMutations[K]>
} & Omit<ActionContext<IEquipmentState, RootState>, 'commit'>;

export interface EquipmentActions {
  [EquipmentActionTypes.CREATE_PROFILE](
    context: AugmentedEquipmentActionContext,
    profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): EquipmentProfile;
  [EquipmentActionTypes.UPDATE_PROFILE](
    context: AugmentedEquipmentActionContext,
    payload: { id: string; updates: Partial<EquipmentProfile> }
  ): void;
  [EquipmentActionTypes.DELETE_PROFILE](
    context: AugmentedEquipmentActionContext,
    id: string
  ): void;
  [EquipmentActionTypes.SET_ACTIVE_PROFILE](
    context: AugmentedEquipmentActionContext,
    id: string
  ): void;
  [EquipmentActionTypes.CREATE_PROFILE_FROM_LOGS](
    context: AugmentedEquipmentActionContext,
    logData: any
  ): EquipmentProfile;
  [EquipmentActionTypes.ENSURE_EXAMPLE_PROFILE](
    context: AugmentedEquipmentActionContext
  ): EquipmentProfile | Promise<EquipmentProfile>;
  [EquipmentActionTypes.EXPORT_PROFILES](
    context: AugmentedEquipmentActionContext
  ): void;
  [EquipmentActionTypes.IMPORT_PROFILES](
    context: AugmentedEquipmentActionContext,
    file: File
  ): Promise<number>;
}

export const equipmentActions: ActionTree<IEquipmentState, RootState> & EquipmentActions = {
  // Profile management
  [EquipmentActionTypes.CREATE_PROFILE]({ commit }, profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const newProfile: EquipmentProfile = {
      ...profile,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate pixel scale if telescope and camera are provided
    if (profile.telescope.focalLength && profile.imagingCamera.pixelSize) {
      newProfile.pixelScale = (profile.imagingCamera.pixelSize * 206.265) / profile.telescope.focalLength;

      // Calculate field of view
      const pixelScale = newProfile.pixelScale;
      newProfile.fieldOfView = {
        width: (profile.imagingCamera.width * pixelScale) / 60, // arcminutes
        height: (profile.imagingCamera.height * pixelScale) / 60 // arcminutes
      };
    }

    commit(EquipmentMutationTypes.ADD_PROFILE, newProfile);
    commit(EquipmentMutationTypes.SET_ACTIVE_PROFILE, newProfile.id);

    return newProfile;
  },

  [EquipmentActionTypes.UPDATE_PROFILE]({ commit }, { id, updates }: { id: string; updates: Partial<EquipmentProfile> }) {
    const updatedProfile = {
      ...updates,
      id,
      updatedAt: new Date()
    };

    // Recalculate pixel scale if telescope or camera changed
    if (updates.telescope || updates.imagingCamera) {
      // This would need the full profile data to calculate properly
      // For now, we'll let the mutation handle it
    }

    commit(EquipmentMutationTypes.UPDATE_PROFILE, updatedProfile);
  },

  [EquipmentActionTypes.DELETE_PROFILE]({ commit }, id: string) {
    commit(EquipmentMutationTypes.REMOVE_PROFILE, id);
  },

  [EquipmentActionTypes.SET_ACTIVE_PROFILE]({ commit }, id: string) {
    commit(EquipmentMutationTypes.SET_ACTIVE_PROFILE, id);
  },

  // Ensure example profile exists and set as active
  [EquipmentActionTypes.ENSURE_EXAMPLE_PROFILE]({ commit, state, dispatch }) {
    // Check if an example profile already exists
    const existingExampleProfile = state.profiles.find(profile => 
      profile.description === 'Demo equipment profile - ASI 2600 MM + Newtonian 800/203 F4'
    );

    if (existingExampleProfile) {
      console.log('Using existing demo equipment profile:', existingExampleProfile.name);
      commit(EquipmentMutationTypes.SET_ACTIVE_PROFILE, existingExampleProfile.id);
      return existingExampleProfile;
    }

    // Create example profile with default data
    const profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Demo: ASI 2600 MM + Newtonian 800/203',
      description: 'Demo equipment profile - ASI 2600 MM + Newtonian 800/203 F4',
      telescope: state.presetTelescopes[0], // Newtonian 800/203 F4
      imagingCamera: state.presetCameras[0], // ASI 2600 MM Pro
      guidingCamera: state.presetCameras.find(c => c.type === 'guiding'),
      mount: state.presetMounts[0], // First preset mount
      accessories: []
    };

    return dispatch(EquipmentActionTypes.CREATE_PROFILE, profile);
  },

  // Create profile from log data
  [EquipmentActionTypes.CREATE_PROFILE_FROM_LOGS]({ commit, state, dispatch }, logData: any) {
    // Check if an example profile already exists
    const existingExampleProfile = state.profiles.find(profile => 
      profile.description === 'Demo equipment profile - ASI 2600 MM + Newtonian 800/203 F4'
    );

    if (existingExampleProfile) {
      // Use existing example profile
      console.log('Using existing demo equipment profile:', existingExampleProfile.name);
      commit(EquipmentMutationTypes.SET_ACTIVE_PROFILE, existingExampleProfile.id);
      return existingExampleProfile;
    }

    // Parse PHD2 log for guide camera info
    let guidingCamera: CameraSpecs | undefined;
    if (logData.phdLog) {
      const cameraMatch = logData.phdLog.match(/Camera = (.+?),.*pixel size = ([\d.]+) um/);
      if (cameraMatch) {
        guidingCamera = {
          id: `guide-${Date.now()}`,
          name: cameraMatch[1],
          type: 'guiding',
          manufacturer: cameraMatch[1].split(' ')[0] || 'Unknown',
          model: cameraMatch[1],
          pixelSize: parseFloat(cameraMatch[2]),
          width: 1304, // Default, could be parsed if available
          height: 976,  // Default, could be parsed if available
          sensorType: 'CMOS',
          cooled: false
        };
      }
    }

    // Create a new example profile with consistent naming
    const profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Demo: ASI 2600 MM + Newtonian 800/203',
      description: 'Demo equipment profile - ASI 2600 MM + Newtonian 800/203 F4',
      telescope: state.presetTelescopes[0], // Default to first preset
      imagingCamera: state.presetCameras[0], // Default to ASI 2600 MM Pro
      guidingCamera,
      mount: state.presetMounts[0], // Default to first preset
      accessories: []
    };

    // Create the profile using the CREATE_PROFILE action
    const newProfile: EquipmentProfile = {
      ...profile,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate pixel scale if telescope and camera are provided
    if (profile.telescope.focalLength && profile.imagingCamera.pixelSize) {
      newProfile.pixelScale = (profile.imagingCamera.pixelSize * 206.265) / profile.telescope.focalLength;

      // Calculate field of view
      const pixelScale = newProfile.pixelScale;
      newProfile.fieldOfView = {
        width: (profile.imagingCamera.width * pixelScale) / 60, // arcminutes
        height: (profile.imagingCamera.height * pixelScale) / 60 // arcminutes
      };
    }

    commit(EquipmentMutationTypes.ADD_PROFILE, newProfile);
    commit(EquipmentMutationTypes.SET_ACTIVE_PROFILE, newProfile.id);

    console.log('Created new demo equipment profile:', newProfile.name);
    return newProfile;
  },

  // Import/Export
  [EquipmentActionTypes.EXPORT_PROFILES]({ state }) {
    const data = {
      profiles: state.profiles,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-profiles-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async [EquipmentActionTypes.IMPORT_PROFILES]({ commit }, file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.profiles && Array.isArray(data.profiles)) {
            data.profiles.forEach((profile: EquipmentProfile) => {
              commit(EquipmentMutationTypes.ADD_PROFILE, {
                ...profile,
                id: `${profile.id}-imported-${Date.now()}`, // Ensure unique ID
                updatedAt: new Date()
              });
            });
            resolve(data.profiles.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
};
