<template>
  <div class="statistics-section">
    <div class="statistics-header">
      <h3 class="statistics-title">
        <span class="statistics-icon">📊</span>
        Performance Statistics
      </h3>
      <p class="statistics-subtitle">
        Key metrics for guiding accuracy analysis
      </p>
    </div>

    <div class="statistics-grid">
      <div class="stat-card rms-card">
        <div class="stat-header">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">RMS Error</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ rmsStats.total.toFixed(3) }}</span>
            <span class="stat-unit">″</span>
          </div>
          <div class="stat-breakdown">
            <div class="stat-component">
              <span class="component-label">RA:</span>
              <span class="component-value">{{ rmsStats.ra.toFixed(3) }}″</span>
            </div>
            <div class="stat-component">
              <span class="component-label">Dec:</span>
              <span class="component-value">{{ rmsStats.dec.toFixed(3) }}″</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card max-error-card">
        <div class="stat-header">
          <span class="stat-icon">⚠️</span>
          <span class="stat-label">Max Error</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ maxError.toFixed(3) }}</span>
            <span class="stat-unit">″</span>
          </div>
          <div class="stat-note">Peak deviation</div>
        </div>
      </div>

      <div class="stat-card duration-card">
        <div class="stat-header">
          <span class="stat-icon">⏱️</span>
          <span class="stat-label">Session Duration</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ formatDuration(sessionDuration) }}</span>
          </div>
          <div class="stat-note">Total guiding time</div>
        </div>
      </div>

      <div class="stat-card points-card">
        <div class="stat-header">
          <span class="stat-icon">📈</span>
          <span class="stat-label">Data Points</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ dataPointsCount.toLocaleString() }}</span>
          </div>
          <div class="stat-note">Total measurements</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rmsStats: {
    total: number;
    ra: number;
    dec: number;
  };
  maxError: number;
  sessionDuration: number;
  dataPointsCount: number;
}

defineProps<Props>();

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
</script>

<style scoped>
.statistics-section {
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.statistics-header {
  margin-bottom: 20px;
}

.statistics-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.statistics-icon {
  font-size: 24px;
}

.statistics-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-primary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.stat-breakdown {
  display: flex;
  gap: 16px;
}

.stat-component {
  display: flex;
  gap: 4px;
  font-size: 12px;
}

.component-label {
  color: var(--text-muted);
  font-weight: 500;
}

.component-value {
  color: var(--text-color);
  font-weight: 600;
}

.stat-note {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}

/* Card-specific colors */
.rms-card {
  border-left: 4px solid #10b981;
}

.max-error-card {
  border-left: 4px solid #ef4444;
}

.duration-card {
  border-left: 4px solid #6366f1;
}

.points-card {
  border-left: 4px solid #f59e0b;
}

@media (max-width: 768px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }
  
  .statistics-section {
    padding: 16px;
  }
  
  .stat-breakdown {
    gap: 12px;
  }
}
</style>
