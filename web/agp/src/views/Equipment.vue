<template>
  <div class="equipment-manager">
    <div class="equipment-header">
      <h2 class="equipment-title">
        <span class="equipment-icon">🔭</span>
        Equipment Profiles
      </h2>
      <p class="equipment-subtitle">
        Manage your telescopes, cameras, and mounts for accurate performance analysis
      </p>
    </div>

    <div class="equipment-actions">
      <button 
        @click="showCreateForm = true" 
        class="btn btn-primary"
      >
        <span class="btn-icon">➕</span>
        New Profile
      </button>
      
      <button 
        @click="exportProfiles" 
        class="btn btn-secondary"
        :disabled="profiles.length === 0"
      >
        <span class="btn-icon">💾</span>
        Export
      </button>
      
      <label class="btn btn-secondary">
        <span class="btn-icon">📂</span>
        Import
        <input 
          type="file" 
          accept=".json" 
          @change="handleImport" 
          style="display: none;"
        >
      </label>
    </div>

    <!-- Active Profile Summary -->
    <div v-if="activeProfile" class="active-profile-card">
      <div class="active-profile-header">
        <h3 class="active-profile-title">
          <span class="active-icon">⭐</span>
          Active Profile: {{ activeProfile.name }}
        </h3>
        <div class="active-profile-actions">
          <button 
            @click="editProfile(activeProfile)" 
            class="btn btn-sm btn-active-edit"
          >
            <span class="btn-icon">✏️</span>
            Edit
          </button>
          <button 
            @click="setActiveProfile(null)" 
            class="btn btn-sm btn-active-deactivate"
          >
            <span class="btn-icon">⏸️</span>
            Deactivate
          </button>
        </div>
      </div>
      
      <div class="active-profile-specs">
        <div class="spec-group">
          <h4>Telescope</h4>
          <div class="spec-details">
            <span class="spec-name">{{ activeProfile.telescope.name }}</span>
            <span class="spec-value">{{ activeProfile.telescope.aperture }}mm f/{{ activeProfile.telescope.focalRatio }}</span>
          </div>
        </div>
        
        <div class="spec-group">
          <h4>Imaging Camera</h4>
          <div class="spec-details">
            <span class="spec-name">{{ activeProfile.imagingCamera.name }}</span>
            <span class="spec-value">{{ activeProfile.imagingCamera.pixelSize }}μm pixels</span>
          </div>
        </div>
        
        <div v-if="activeProfile.guidingCamera" class="spec-group">
          <h4>Guide Camera</h4>
          <div class="spec-details">
            <span class="spec-name">{{ activeProfile.guidingCamera.name }}</span>
            <span class="spec-value">{{ activeProfile.guidingCamera.pixelSize }}μm pixels</span>
          </div>
        </div>
        
        <div class="spec-group">
          <h4>Performance</h4>
          <div class="spec-details">
            <span class="spec-name">Pixel Scale</span>
            <span class="spec-value">{{ activeProfile.pixelScale?.toFixed(2) }}″/px</span>
          </div>
          <div class="spec-details" v-if="activeProfile.fieldOfView">
            <span class="spec-name">Field of View</span>
            <span class="spec-value">{{ activeProfile.fieldOfView.width.toFixed(1) }}′ × {{ activeProfile.fieldOfView.height.toFixed(1) }}′</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile List -->
    <div class="profiles-section">
      <h3 class="section-title">All Profiles ({{ profiles.length }})</h3>
      
      <div v-if="profiles.length === 0" class="empty-state">
        <div class="empty-icon">🔭</div>
        <h4>No Equipment Profiles</h4>
        <p>Create your first equipment profile to start analyzing your guiding performance with accurate specifications.</p>
        <button @click="showCreateForm = true" class="btn btn-primary">
          Create First Profile
        </button>
      </div>
      
      <div v-else class="profiles-grid">
        <div 
          v-for="profile in profiles" 
          :key="profile.id"
          class="profile-card"
          :class="{ 'active': profile.id === activeProfile?.id }"
        >
          <div class="profile-header">
            <h4 class="profile-name">{{ profile.name }}</h4>
            <div class="profile-actions">
              <button 
                v-if="profile.id !== activeProfile?.id"
                @click="setActiveProfile(profile.id)" 
                class="btn btn-xs btn-activate"
              >
                <span class="btn-icon">⭐</span>
                Activate
              </button>
              <button 
                @click="editProfile(profile)" 
                class="btn btn-xs btn-edit"
              >
                <span class="btn-icon">✏️</span>
                Edit
              </button>
              <button 
                @click="deleteProfileWithConfirm(profile)" 
                class="btn btn-xs btn-delete"
              >
                <span class="btn-icon">🗑️</span>
                Delete
              </button>
            </div>
          </div>
          
          <div class="profile-description">
            {{ profile.description }}
          </div>
          
          <div class="profile-summary">
            <div class="summary-item">
              <span class="summary-label">Telescope:</span>
              <span class="summary-value">{{ profile.telescope.name }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Camera:</span>
              <span class="summary-value">{{ profile.imagingCamera.name }}</span>
            </div>
            <div class="summary-item" v-if="profile.pixelScale">
              <span class="summary-label">Pixel Scale:</span>
              <span class="summary-value">{{ profile.pixelScale.toFixed(2) }}″/px</span>
            </div>
          </div>
          
          <div class="profile-meta">
            <span class="meta-date">Created {{ formatDate(profile.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Form Modal -->
    <div v-if="showCreateForm || editingProfile" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <EquipmentProfileForm
          :profile="editingProfile"
          @save="handleSaveProfile"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EquipmentProfileForm from '../components/Equipment/EquipmentProfileForm.vue';

// Define a simplified EquipmentProfile interface for now
interface EquipmentProfile {
  id: string;
  name: string;
  description: string;
  telescope: {
    name: string;
    aperture: number;
    focalLength: number;
    focalRatio: number;
  };
  imagingCamera: {
    name: string;
    pixelSize: number;
  };
  guidingCamera?: {
    name: string;
    pixelSize: number;
  };
  createdAt: Date;
  pixelScale?: number;
  fieldOfView?: {
    width: number;
    height: number;
  };
}

// Reactive state
const showCreateForm = ref(false);
const editingProfile = ref<EquipmentProfile | null>(null);

// Temporary local storage for profiles (replacing store for now)
const profiles = ref<EquipmentProfile[]>([]);
const activeProfileId = ref<string | null>(null);

// Computed properties
const activeProfile = computed(() => {
  if (!activeProfileId.value) return null;
  return profiles.value.find((p: EquipmentProfile) => p.id === activeProfileId.value) || null;
});

// Methods
const setActiveProfile = (id: string | null) => {
  activeProfileId.value = id;
};

const editProfile = (profile: EquipmentProfile) => {
  editingProfile.value = profile;
};

const deleteProfileWithConfirm = (profile: EquipmentProfile) => {
  if (confirm(`Are you sure you want to delete "${profile.name}"?`)) {
    const index = profiles.value.findIndex((p: EquipmentProfile) => p.id === profile.id);
    if (index !== -1) {
      profiles.value.splice(index, 1);
      if (activeProfileId.value === profile.id) {
        activeProfileId.value = null;
      }
    }
  }
};

const calculateProfileMetrics = (profileData: any): EquipmentProfile => {
  const profile = { ...profileData };
  
  // Calculate pixel scale if telescope and camera are provided
  if (profile.telescope?.focalLength && profile.imagingCamera?.pixelSize) {
    profile.pixelScale = (profile.imagingCamera.pixelSize * 206.265) / profile.telescope.focalLength;
    
    // Calculate field of view
    if (profile.imagingCamera.width && profile.imagingCamera.height) {
      profile.fieldOfView = {
        width: Number(((profile.imagingCamera.width * profile.pixelScale) / 60).toFixed(1)),
        height: Number(((profile.imagingCamera.height * profile.pixelScale) / 60).toFixed(1))
      };
    }
  }
  
  return profile;
};

const handleSaveProfile = (profileData: any) => {
  if (editingProfile.value) {
    // Update existing profile
    const index = profiles.value.findIndex((p: EquipmentProfile) => p.id === editingProfile.value!.id);
    if (index !== -1) {
      const updatedProfile = calculateProfileMetrics({
        ...profileData,
        id: editingProfile.value.id,
        createdAt: editingProfile.value.createdAt,
        updatedAt: new Date()
      });
      profiles.value.splice(index, 1, updatedProfile);
    }
  } else {
    // Create new profile
    const newProfile = calculateProfileMetrics({
      ...profileData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    profiles.value.push(newProfile);
    activeProfileId.value = newProfile.id;
  }
  closeForm();
};

const closeForm = () => {
  showCreateForm.value = false;
  editingProfile.value = null;
};

const exportProfiles = () => {
  const data = {
    profiles: profiles.value,
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
};

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.profiles && Array.isArray(data.profiles)) {
      data.profiles.forEach((profile: EquipmentProfile) => {
        const importedProfile = {
          ...profile,
          id: `${profile.id}-imported-${Date.now()}`,
          updatedAt: new Date()
        };
        profiles.value.push(importedProfile);
      });
      alert(`Successfully imported ${data.profiles.length} profiles!`);
    } else {
      alert('Invalid file format');
    }
  } catch (error: any) {
    alert(`Import failed: ${error.message}`);
  }
  
  // Reset file input
  target.value = '';
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

// Initialize with default profile if none exists
onMounted(() => {
  if (profiles.value.length === 0) {
    // Create a default profile with the user's Newtonian telescope
    const defaultProfile = {
      name: 'My Setup',
      description: 'Newtonian 800/203 F4 setup',
      telescope: {
        name: 'Newtonian 800/203 F4',
        aperture: 203,
        focalLength: 800,
        focalRatio: 4.0
      },
      imagingCamera: {
        name: 'ASI 2600 MM Pro',
        pixelSize: 3.76,
        width: 6248,
        height: 4176
      },
      guidingCamera: {
        name: 'ASI 224 MC',
        pixelSize: 3.75
      }
    };
    
    handleSaveProfile(defaultProfile);
  }
});
</script>

<style scoped>
.equipment-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.equipment-header {
  text-align: center;
  margin-bottom: 32px;
}

.equipment-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.equipment-icon {
  font-size: 32px;
}

.equipment-subtitle {
  color: var(--text-muted);
  font-size: 16px;
  margin: 0;
}

.equipment-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-icon {
  font-size: 0.9em;
  line-height: 1;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

.btn-outline {
  background: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: var(--hover-bg);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}

.btn-ghost:hover {
  color: var(--text-color);
  background: var(--hover-bg);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Active Profile Button Styles */
.btn-active-edit {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
}

.btn-active-edit:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-active-deactivate {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: 1px solid rgba(220, 38, 38, 0.8);
}

.btn-active-deactivate:hover {
  background: rgba(220, 38, 38, 1);
  border-color: rgba(185, 28, 28, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Profile Card Button Styles */
.btn-activate {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-activate:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
}

.btn-edit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);
}

/* Active Profile Card */
.active-profile-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  color: white;
}

.active-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.active-profile-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.active-icon {
  font-size: 20px;
}

.active-profile-actions {
  display: flex;
  gap: 8px;
}

.active-profile-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.spec-group h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
  opacity: 0.8;
}

.spec-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.spec-name {
  font-size: 14px;
  opacity: 0.9;
}

.spec-value {
  font-size: 14px;
  font-weight: 600;
}

/* Profiles Section */
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 24px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.profile-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.profile-card.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.active-profile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-description {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.4;
}

.profile-summary {
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
}

.summary-label {
  color: var(--text-muted);
  font-weight: 500;
}

.summary-value {
  color: var(--text-color);
  font-weight: 600;
}

.profile-meta {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-muted);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-color);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .equipment-manager {
    padding: 16px;
  }
  
  .equipment-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .active-profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .active-profile-specs {
    grid-template-columns: 1fr;
  }
  
  .profiles-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .profile-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
