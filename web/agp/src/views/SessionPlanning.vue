<template>
  <div class="session-planning">
    <div class="planning-header">
      <h2 class="planning-title">
        <span class="planning-icon">🌌</span>
        Session Planning
      </h2>
      <p class="planning-subtitle">
        Plan your astrophotography sessions with target visibility analysis
      </p>
    </div>

    <div class="planning-controls">
      <div class="control-group">
        <label>Observation Date</label>
        <input type="date" v-model="observationDate" class="input-date" />
      </div>

      <div class="control-group">
        <label>Observer Location</label>
        <div class="location-inputs">
          <input 
            type="number" 
            v-model.number="location.latitude" 
            placeholder="Latitude"
            step="0.1"
            class="input-location"
          />
          <input 
            type="number" 
            v-model.number="location.longitude" 
            placeholder="Longitude"
            step="0.1"
            class="input-location"
          />
        </div>
      </div>

      <div class="control-group">
        <label>Search Targets</label>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name or catalog ID..."
          class="input-search"
        />
      </div>
    </div>

    <div class="planning-content">
      <div class="target-browser">
        <h3 class="section-title">Available Targets</h3>

        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-tab', { active: activeFilter === filter.value }]"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="target-list">
          <div 
            v-for="target in filteredTargets" 
            :key="target.id"
            @click="selectTarget(target)"
            :class="['target-card', { selected: selectedTarget?.id === target.id }]"
          >
            <div class="target-info">
              <div class="target-name">
                <span class="target-id">{{ target.id }}</span>
                <span class="target-title">{{ target.name }}</span>
              </div>
              <div class="target-meta">
                <span class="target-type">{{ target.type }}</span>
                <span class="target-constellation">{{ target.constellation }}</span>
                <span :class="['target-difficulty', target.difficulty.toLowerCase()]">
                  {{ target.difficulty }}
                </span>
              </div>
            </div>
            <div class="target-stats">
              <div class="stat">
                <span class="stat-label">Magnitude</span>
                <span class="stat-value">{{ target.magnitude }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Size</span>
                <span class="stat-value">{{ target.size }}'</span>
              </div>
            </div>
          </div>

          <div v-if="filteredTargets.length === 0" class="no-targets">
            <p>No targets found matching your search</p>
          </div>
        </div>
      </div>

      <div class="target-details" v-if="selectedTarget">
        <h3 class="section-title">{{ selectedTarget.name }} ({{ selectedTarget.id }})</h3>

        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">{{ selectedTarget.type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Constellation</span>
            <span class="detail-value">{{ selectedTarget.constellation }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">RA</span>
            <span class="detail-value">{{ formatRA(selectedTarget.ra) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Dec</span>
            <span class="detail-value">{{ formatDec(selectedTarget.dec) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Magnitude</span>
            <span class="detail-value">{{ selectedTarget.magnitude }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Size</span>
            <span class="detail-value">{{ selectedTarget.size }}'</span>
          </div>
        </div>

        <div v-if="visibility" class="visibility-info">
          <h4>Visibility for {{ formattedDate }}</h4>

          <div v-if="visibility.neverRises" class="alert alert-error">
            ⚠️ This target never rises above the horizon from your location
          </div>

          <div v-else-if="visibility.alwaysUp" class="alert alert-success">
            ✓ This target is circumpolar (always above horizon)
          </div>

          <div v-else class="visibility-details">
            <div class="visibility-window">
              <h5>Dark Time Window</h5>
              <div class="window-times">
                <div class="time-item">
                  <span class="time-label">Sunset</span>
                  <span class="time-value">{{ formatTime(visibility.darkTimeWindow.start) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">Sunrise</span>
                  <span class="time-value">{{ formatTime(visibility.darkTimeWindow.end) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">Transit</span>
                  <span class="time-value">{{ formatTime(visibility.darkTimeWindow.transitTime) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">Max Altitude</span>
                  <span class="time-value">{{ visibility.darkTimeWindow.maxAltitude.toFixed(1) }}°</span>
                </div>
              </div>
            </div>

            <div v-if="visibility.bestObservingWindow" class="visibility-window best">
              <h5>Best Observing Window</h5>
              <div class="window-times">
                <div class="time-item">
                  <span class="time-label">Start</span>
                  <span class="time-value">{{ formatTime(visibility.bestObservingWindow.start) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">End</span>
                  <span class="time-value">{{ formatTime(visibility.bestObservingWindow.end) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">Duration</span>
                  <span class="time-value">{{ calculateDuration(visibility.bestObservingWindow.start, visibility.bestObservingWindow.end) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">Peak Altitude</span>
                  <span class="time-value">{{ visibility.bestObservingWindow.maxAltitude.toFixed(1) }}°</span>
                </div>
              </div>
            </div>

            <div v-else class="alert alert-warning">
              ⚠️ Target does not reach optimal altitude (>30°) during dark hours
            </div>
          </div>

          <div v-if="meridianFlip && !visibility.neverRises" class="meridian-flip-info">
            <h5>Meridian Flip Information</h5>
            <div class="flip-details">
              <div class="flip-item">
                <span class="flip-label">Current Side</span>
                <span class="flip-value">{{ meridianFlip.side }}</span>
              </div>
              <div class="flip-item">
                <span class="flip-label">Hour Angle</span>
                <span class="flip-value">{{ meridianFlip.currentHourAngle.toFixed(2) }}h</span>
              </div>
              <div class="flip-item">
                <span class="flip-label">Flip Required</span>
                <span :class="['flip-value', meridianFlip.isRequired ? 'warning' : 'success']">
                  {{ meridianFlip.isRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              <div v-if="!meridianFlip.isRequired && meridianFlip.flipTime" class="flip-item">
                <span class="flip-label">Next Flip</span>
                <span class="flip-value">{{ formatTime(meridianFlip.flipTime) }}</span>
              </div>
            </div>
          </div>

          <div v-if="moonInfo" class="moon-info">
            <h5>Moon Information</h5>
            <div class="moon-details">
              <div class="moon-item">
                <span class="moon-label">Phase</span>
                <span class="moon-value">{{ moonInfo.phaseName }}</span>
              </div>
              <div class="moon-item">
                <span class="moon-label">Illumination</span>
                <span class="moon-value">{{ moonInfo.illumination }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="target-placeholder">
        <p>Select a target to view visibility details</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { 
  MESSIER_CATALOG, 
  searchTargets,
  getTargetsBySeason,
  getTargetsByType,
  getTargetsByDifficulty,
  DeepSkyObject
} from '@/data/targets';
import { 
  calculateTargetVisibility,
  ObserverLocation,
  TargetVisibility,
  calculateMoonPhase,
  calculateMoonIllumination
} from '@/utilities/astronomy';
import {
  predictMeridianFlip,
  MeridianFlipPrediction
} from '@/utilities/astronomy';

export default defineComponent({
  name: 'SessionPlanning',
  
  setup() {
    const searchQuery = ref('');
    const activeFilter = ref('all');
    const selectedTarget = ref<DeepSkyObject | null>(null);
    const observationDate = ref(new Date().toISOString().split('T')[0]);
    
    const location = ref<ObserverLocation>({
      latitude: 52.0,
      longitude: 5.0,
      elevation: 0
    });

    const filters = [
      { label: 'All', value: 'all' },
      { label: 'Galaxies', value: 'Galaxy' },
      { label: 'Nebulae', value: 'nebulae' },
      { label: 'Clusters', value: 'clusters' },
      { label: 'Easy', value: 'Easy' },
      { label: 'Winter', value: 'Winter' },
      { label: 'Spring', value: 'Spring' },
      { label: 'Summer', value: 'Summer' },
      { label: 'Fall', value: 'Fall' }
    ];

    const filteredTargets = computed(() => {
      let targets = MESSIER_CATALOG;

      if (activeFilter.value !== 'all') {
        if (['Winter', 'Spring', 'Summer', 'Fall'].includes(activeFilter.value)) {
          targets = getTargetsBySeason(activeFilter.value as DeepSkyObject['season']);
        } else if (['Easy', 'Moderate', 'Hard'].includes(activeFilter.value)) {
          targets = getTargetsByDifficulty(activeFilter.value as DeepSkyObject['difficulty']);
        } else if (activeFilter.value === 'Galaxy') {
          targets = getTargetsByType('Galaxy');
        } else if (activeFilter.value === 'nebulae') {
          targets = [
            ...getTargetsByType('Emission Nebula'),
            ...getTargetsByType('Planetary Nebula'),
            ...getTargetsByType('Supernova Remnant')
          ];
        } else if (activeFilter.value === 'clusters') {
          targets = [
            ...getTargetsByType('Open Cluster'),
            ...getTargetsByType('Globular Cluster')
          ];
        }
      }

      if (searchQuery.value.trim()) {
        targets = searchTargets(searchQuery.value);
      }

      return targets;
    });

    const visibility = ref<TargetVisibility | null>(null);
    const meridianFlip = ref<MeridianFlipPrediction | null>(null);

    const moonInfo = computed(() => {
      if (!observationDate.value) return null;
      
      const date = new Date(observationDate.value);
      const phase = calculateMoonPhase(date);
      const illumination = Math.round(calculateMoonIllumination(phase) * 100);
      
      let phaseName = 'New Moon';
      if (phase < 0.125) phaseName = 'New Moon';
      else if (phase < 0.25) phaseName = 'Waxing Crescent';
      else if (phase < 0.375) phaseName = 'First Quarter';
      else if (phase < 0.5) phaseName = 'Waxing Gibbous';
      else if (phase < 0.625) phaseName = 'Full Moon';
      else if (phase < 0.75) phaseName = 'Waning Gibbous';
      else if (phase < 0.875) phaseName = 'Last Quarter';
      else phaseName = 'Waning Crescent';
      
      return { phase, illumination, phaseName };
    });

    const formattedDate = computed(() => {
      const date = new Date(observationDate.value);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    });

    const selectTarget = (target: DeepSkyObject) => {
      selectedTarget.value = target;
      updateVisibility();
    };

    const updateVisibility = () => {
      if (!selectedTarget.value) return;

      const date = new Date(observationDate.value);
      
      visibility.value = calculateTargetVisibility(
        { ra: selectedTarget.value.ra, dec: selectedTarget.value.dec },
        location.value,
        date,
        15
      );

      meridianFlip.value = predictMeridianFlip(
        { ra: selectedTarget.value.ra, dec: selectedTarget.value.dec },
        location.value,
        date
      );
    };

    watch([observationDate, location], () => {
      if (selectedTarget.value) {
        updateVisibility();
      }
    }, { deep: true });

    const formatRA = (ra: number): string => {
      const hours = Math.floor(ra);
      const minutes = Math.floor((ra - hours) * 60);
      const seconds = Math.floor(((ra - hours) * 60 - minutes) * 60);
      return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    };

    const formatDec = (dec: number): string => {
      const sign = dec >= 0 ? '+' : '-';
      const absDec = Math.abs(dec);
      const degrees = Math.floor(absDec);
      const minutes = Math.floor((absDec - degrees) * 60);
      const seconds = Math.floor(((absDec - degrees) * 60 - minutes) * 60);
      return `${sign}${degrees.toString().padStart(2, '0')}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}"`;
    };

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start: Date, end: Date): string => {
      const minutes = (end.getTime() - start.getTime()) / 60000;
      const hours = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return `${hours}h ${mins}m`;
    };

    return {
      searchQuery,
      activeFilter,
      selectedTarget,
      observationDate,
      location,
      filters,
      filteredTargets,
      visibility,
      meridianFlip,
      moonInfo,
      formattedDate,
      selectTarget,
      formatRA,
      formatDec,
      formatTime,
      calculateDuration
    };
  }
});
</script>

<style scoped>
.session-planning {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.planning-header {
  text-align: center;
  margin-bottom: 2rem;
}

.planning-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.planning-icon {
  font-size: 2.5rem;
}

.planning-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.planning-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.input-date,
.input-search,
.input-location {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.input-date:focus,
.input-search:focus,
.input-location:focus {
  outline: none;
  border-color: #3498db;
}

.location-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.planning-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
}

.target-browser,
.target-details {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1a1a1a;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.filter-tab:hover {
  border-color: #3498db;
}

.filter-tab.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.target-list {
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.target-card {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.target-card:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.target-card.selected {
  border-color: #3498db;
  background: #f0f8ff;
}

.target-info {
  margin-bottom: 0.75rem;
}

.target-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.target-id {
  font-weight: 700;
  color: #3498db;
  font-size: 0.9rem;
}

.target-title {
  font-weight: 600;
  color: #1a1a1a;
}

.target-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.target-type,
.target-constellation {
  color: #666;
}

.target-difficulty {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.target-difficulty.easy {
  background: #d4edda;
  color: #155724;
}

.target-difficulty.moderate {
  background: #fff3cd;
  color: #856404;
}

.target-difficulty.hard {
  background: #f8d7da;
  color: #721c24;
}

.target-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #1a1a1a;
}

.no-targets,
.target-placeholder {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.visibility-info {
  margin-top: 2rem;
}

.visibility-info h4,
.visibility-info h5 {
  margin-bottom: 1rem;
  color: #1a1a1a;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.visibility-window {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.visibility-window.best {
  background: #e8f4f8;
  border: 2px solid #3498db;
}

.window-times {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.time-item,
.flip-item,
.moon-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-label,
.flip-label,
.moon-label {
  font-size: 0.85rem;
  color: #666;
}

.time-value,
.flip-value,
.moon-value {
  font-weight: 600;
  color: #1a1a1a;
}

.flip-value.warning {
  color: #dc3545;
}

.flip-value.success {
  color: #28a745;
}

.meridian-flip-info,
.moon-info {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1.5rem;
}

.flip-details,
.moon-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 1024px) {
  .planning-content {
    grid-template-columns: 1fr;
  }
  
  .target-browser {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .planning-controls {
    grid-template-columns: 1fr;
  }
  
  .details-grid,
  .window-times,
  .flip-details,
  .moon-details {
    grid-template-columns: 1fr;
  }
}
</style>
