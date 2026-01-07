<template>
  <div class="polar-alignment-section">
    <div class="section-header">
      <h3>
        <span class="icon">🧭</span>
        Polar Alignment Analysis
      </h3>
    </div>

    <div v-if="!alignmentAnalysis || alignmentAnalysis.error.confidence === 0" class="no-data">
      <p>{{ alignmentAnalysis?.recommendation || 'No polar alignment data available' }}</p>
    </div>

    <div v-else class="alignment-content">
      <div class="quality-banner" :class="`quality-${alignmentAnalysis.quality}`">
        <div class="quality-label">Alignment Quality</div>
        <div class="quality-value">{{ alignmentAnalysis.quality.toUpperCase() }}</div>
        <div class="quality-score">{{ qualityScore }}/100</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Altitude Error</div>
          <div class="stat-value">{{ alignmentAnalysis.error.altitudeError.toFixed(2) }}'</div>
          <div class="stat-direction">{{ alignmentAnalysis.corrections.altitude.direction }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Azimuth Error</div>
          <div class="stat-value">{{ alignmentAnalysis.error.azimuthError.toFixed(2) }}'</div>
          <div class="stat-direction">{{ alignmentAnalysis.corrections.azimuth.direction }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total Error</div>
          <div class="stat-value">{{ alignmentAnalysis.error.totalError.toFixed(2) }}'</div>
          <div class="stat-info">vector magnitude</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Confidence</div>
          <div class="stat-value">{{ (alignmentAnalysis.error.confidence * 100).toFixed(0) }}%</div>
          <div class="stat-info">{{ alignmentAnalysis.error.hemisphere }}</div>
        </div>
      </div>

      <div class="correction-guide">
        <h4>Correction Guide</h4>
        <div class="corrections">
          <div class="correction-item altitude">
            <div class="correction-icon">⬆️</div>
            <div class="correction-details">
              <div class="correction-title">Altitude Adjustment</div>
              <div class="correction-instruction">{{ alignmentAnalysis.corrections.altitude.description }}</div>
            </div>
          </div>

          <div class="correction-item azimuth">
            <div class="correction-icon">⬅️</div>
            <div class="correction-details">
              <div class="correction-title">Azimuth Adjustment</div>
              <div class="correction-instruction">{{ alignmentAnalysis.corrections.azimuth.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="recommendation-box">
        <div class="recommendation-icon">💡</div>
        <div class="recommendation-text">{{ alignmentAnalysis.recommendation }}</div>
      </div>

      <div class="drift-data">
        <h4>Drift Analysis Data</h4>
        <div class="drift-stats">
          <div class="drift-stat">
            <span class="drift-label">East of Meridian:</span>
            <span class="drift-value">{{ alignmentAnalysis.eastDriftRate.toFixed(2) }}" /min</span>
          </div>
          <div class="drift-stat">
            <span class="drift-label">West of Meridian:</span>
            <span class="drift-value">{{ alignmentAnalysis.westDriftRate.toFixed(2) }}" /min</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { analyzePolarAlignment, calculateAlignmentQuality } from '@/utilities/computations';
import type { PolarAlignmentAnalysis } from '@/utilities/computations';
import type { GuidingFrame } from '@/store/modules/PHD/PHD.types';

interface Props {
  guidingFrames: GuidingFrame[];
  pixelScale: number;
  latitude?: number;
}

const props = withDefaults(defineProps<Props>(), {
  latitude: 52.0
});

const alignmentAnalysis = computed((): PolarAlignmentAnalysis | null => {
  if (!props.guidingFrames || props.guidingFrames.length < 20) {
    return null;
  }
  return analyzePolarAlignment(props.guidingFrames, props.pixelScale, props.latitude);
});

const qualityScore = computed((): number => {
  if (!alignmentAnalysis.value) return 0;
  return Math.round(calculateAlignmentQuality(alignmentAnalysis.value.error.totalError));
});
</script>

<style scoped>
.polar-alignment-section {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--gray-800);
}

.icon {
  font-size: 1.5rem;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  background: var(--gray-50);
  border-radius: var(--border-radius);
}

.alignment-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quality-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
}

.quality-excellent {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.quality-good {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.quality-fair {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.quality-poor {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.quality-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.quality-value {
  font-size: 1.25rem;
  letter-spacing: 0.05em;
}

.quality-score {
  font-size: 1.5rem;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  padding: 1rem;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  font-family: 'Courier New', monospace;
}

.stat-direction {
  font-size: 0.875rem;
  color: var(--gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
  font-weight: 600;
}

.stat-info {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.correction-guide {
  background: var(--gray-50);
  border-radius: var(--border-radius);
  padding: 1.5rem;
}

.correction-guide h4 {
  margin: 0 0 1rem 0;
  color: var(--gray-800);
}

.corrections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.correction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--white);
  border: 2px solid var(--primary-color);
  border-radius: var(--border-radius);
}

.correction-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.correction-details {
  flex: 1;
}

.correction-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.correction-instruction {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.recommendation-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left: 4px solid var(--primary-color);
  border-radius: var(--border-radius);
}

.recommendation-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.recommendation-text {
  color: var(--gray-800);
  font-weight: 500;
}

.drift-data {
  border-top: 1px solid var(--gray-200);
  padding-top: 1rem;
}

.drift-data h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.drift-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.drift-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drift-label {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.drift-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--gray-800);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quality-banner {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .drift-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
