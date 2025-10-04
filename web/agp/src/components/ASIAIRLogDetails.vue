<template>
  <div class="asiair-log-details">
    <div class="details-header">
      <h2 class="details-title">
        <span class="details-icon">🖥️</span>
        ASIAIR Autorun Log Details
      </h2>
    </div>
    
    <div class="summary-cards">
      <div class="summary-card date-card">
        <div class="card-header">
          <span class="card-icon">📅</span>
          <h3>Log Date</h3>
        </div>
        <div class="card-content">
          <div class="summary-value">{{ formatDate(asiairLog.datetime) }}</div>
        </div>
      </div>
      
      <div class="summary-card sessions-card">
        <div class="card-header">
          <span class="card-icon">🎯</span>
          <h3>Autorun Sessions</h3>
        </div>
        <div class="card-content">
          <div class="summary-value">{{ asiairLog.autoruns.length }}</div>
        </div>
      </div>
    </div>
    
    <div class="targets-section">
      <h3 class="section-title">
        <span class="section-icon">🎯</span>
        Imaging Targets & Plans
      </h3>
      
      <div class="targets-grid">
        <div 
          v-for="(autorun, index) in asiairLog.autoruns" 
          :key="autorun.startTime"
          class="target-card"
        >
          <div class="target-header">
            <span class="target-number">{{ index + 1 }}</span>
            <h4 class="target-title">{{ autorun.plan || 'Unnamed Target' }}</h4>
          </div>
          <div class="target-content">
            <div class="plan-details">
              {{ formatPlanText(autorun) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Autorun, ASIAIRLog, ExposureEvent } from '../store/modules/ASIAIR/ASIAIR.types';
import { groupBy } from '../utilities/helpers';

export default defineComponent({
  name: 'AutorunLogDetails',
  props: {
    asiairLog: {
      type: Object as PropType<ASIAIRLog>,
      required: true
    },
  },
  components: {
  },
  setup(props, { emit }) {

    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };

    const formatPlanText = (autorun: Autorun) => {
      const lights = autorun.exposureEvents.filter((exposure => exposure.type === "Light"));
      const biases = autorun.exposureEvents.filter((exposure => exposure.type === "Bias"));
      const darks = autorun.exposureEvents.filter((exposure => exposure.type === "Dark"));
      const flats = autorun.exposureEvents.filter((exposure => exposure.type === "Flat"));

      const parts: string[] = [];
      
      if (lights.length > 0) {
        groupBy(lights, (light: ExposureEvent) => light.integrationTime).forEach((grouped) => {
          parts.push(`💡 Light: ${grouped.length}× ${grouped[0]?.integrationTime}s`);
        });
      }
      if (biases.length > 0) {
        groupBy(biases, (bias: ExposureEvent) => bias.integrationTime).forEach((grouped) => {
          parts.push(`🔲 Bias: ${grouped.length}× ${grouped[0]?.integrationTime}s`);
        });
      }
      if (darks.length > 0) {
        groupBy(darks, (dark: ExposureEvent) => dark.integrationTime).forEach((grouped) => {
          parts.push(`⚫ Dark: ${grouped.length}× ${grouped[0]?.integrationTime}s`);
        });
      }
      if (flats.length > 0) {
        groupBy(flats, (flat: ExposureEvent) => flat.integrationTime).forEach((grouped) => {
          parts.push(`◻️ Flat: ${grouped.length}× ${grouped[0]?.integrationTime}s`);
        });
      }
      
      return parts.length > 0 ? parts.join('\n') : 'No exposure data available';
    };

    return { formatDate, formatPlanText };
  },
});
</script>

<style scoped>
.asiair-log-details {
  padding: 1.5rem;
}

.details-header {
  margin-bottom: 1.5rem;
}

.details-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.details-icon {
  font-size: 1.75rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--transition);
}

.summary-card:hover {
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.date-card {
  border-left: 4px solid var(--primary-color);
}

.sessions-card {
  border-left: 4px solid var(--success-color);
}

.card-header {
  background: var(--white);
  padding: 1rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  font-size: 1.25rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}

.card-content {
  padding: 1rem;
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
}

.targets-section {
  margin-top: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1.5rem;
}

.section-icon {
  font-size: 1.5rem;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.target-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--transition);
  border-left: 4px solid var(--accent-color);
}

.target-card:hover {
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.target-header {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
  padding: 1rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.target-number {
  background: var(--accent-color);
  color: var(--white);
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.target-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
}

.target-content {
  padding: 1rem;
}

.plan-details {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--gray-700);
  background: var(--gray-50);
  padding: 1rem;
  border-radius: var(--border-radius);
  white-space: pre-line;
  border: 1px solid var(--gray-200);
}

@media (max-width: 768px) {
  .asiair-log-details {
    padding: 1rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .targets-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .target-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .plan-details {
    font-size: 0.8rem;
    padding: 0.75rem;
  }
}
</style>
