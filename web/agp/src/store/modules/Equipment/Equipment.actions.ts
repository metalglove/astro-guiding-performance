import { ActionTree } from 'vuex';
import { EquipmentState, EquipmentProfile, TelescopeSpecs, CameraSpecs, MountSpecs } from './Equipment.types';
import { RootState } from '../../index';

export const equipmentActions: ActionTree<EquipmentState, RootState> = {
  // Profile management
  createProfile({ commit }, profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'>) {
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
    
    commit('ADD_PROFILE', newProfile);
    commit('SET_ACTIVE_PROFILE', newProfile.id);
    
    return newProfile;
  },

  updateProfile({ commit }, { id, updates }: { id: string; updates: Partial<EquipmentProfile> }) {
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
    
    commit('UPDATE_PROFILE', updatedProfile);
  },

  deleteProfile({ commit }, id: string) {
    commit('REMOVE_PROFILE', id);
  },

  setActiveProfile({ commit }, id: string) {
    commit('SET_ACTIVE_PROFILE', id);
  },

  // Create profile from log data
  createProfileFromLogs({ commit, state }, logData: any) {
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

    // Create a default profile with available data
    const profile: Omit<EquipmentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `Session ${new Date().toLocaleDateString()}`,
      description: 'Auto-generated from log files',
      telescope: state.presetTelescopes[0], // Default to first preset
      imagingCamera: state.presetCameras[0], // Default to ASI 2600 MM Pro
      guidingCamera,
      mount: state.presetMounts[0], // Default to first preset
      accessories: []
    };

    return this.dispatch('equipment/createProfile', profile);
  },

  // Import/Export
  exportProfiles({ state }) {
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

  async importProfiles({ commit }, file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.profiles && Array.isArray(data.profiles)) {
            data.profiles.forEach((profile: EquipmentProfile) => {
              commit('ADD_PROFILE', {
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
