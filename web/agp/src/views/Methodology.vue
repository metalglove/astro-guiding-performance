<template>
  <div class="methodology-page">
    <div class="methodology-header">
      <h1 class="methodology-title">
        <span class="methodology-icon">🔬</span>
        Analysis Methodology
      </h1>
      <p class="methodology-subtitle">
        Understanding the science behind guiding performance metrics
      </p>
    </div>

    <div class="methodology-content">
      <!-- Overview Section -->
      <section class="methodology-section">
        <h2>Overview</h2>
        <p>
          This tool analyzes PHD2 guiding logs to provide quantitative insights into autoguiding performance
          for astrophotography. Our analysis focuses on translating raw guiding corrections into meaningful 
          metrics that help evaluate imaging quality potential.
        </p>
      </section>

      <!-- Data Processing Section -->
      <section class="methodology-section">
        <h2>Data Processing</h2>
        
        <h3>Input Data</h3>
        <ul>
          <li><strong>PHD2 Guide Logs:</strong> Time-series corrections in camera coordinates (dx, dy)</li>
          <li><strong>Pixel Scale:</strong> Angular resolution per pixel from calibration data</li>
          <li><strong>Binning Factor:</strong> Camera binning settings affecting pixel scale</li>
        </ul>

        <h3>Coordinate System Transformation</h3>
        <p>
          Raw guiding corrections are converted from pixels to angular measurements:
        </p>
        <div class="formula">
          <code>
            Error (arcseconds) = Error (pixels) × Pixel Scale (″/px) × Binning Factor
          </code>
        </div>
        <p>
          This transformation enables analysis in terms of actual angular accuracy rather than camera-specific pixel units.
        </p>
      </section>

      <!-- Statistical Metrics Section -->
      <section class="methodology-section">
        <h2>Statistical Metrics</h2>

        <h3>RMS Error Calculation</h3>
        <p>
          Root Mean Square (RMS) error provides a robust measure of guiding accuracy:
        </p>
        <div class="formula">
          <code>
            RMS = √(Σ(error²) / n)
          </code>
        </div>
        <p>
          We calculate separate RMS values for:
        </p>
        <ul>
          <li><strong>RA (Right Ascension):</strong> East-West guiding accuracy</li>
          <li><strong>Dec (Declination):</strong> North-South guiding accuracy</li>
          <li><strong>Total:</strong> Combined magnitude: √(RA² + Dec²)</li>
        </ul>

        <h3>Cumulative Distribution Function (CDF)</h3>
        <p>
          The CDF shows the percentage of measurements below each error threshold, providing
          insight into the distribution of guiding accuracy across the entire session.
        </p>
      </section>

      <!-- Quality Thresholds Section -->
      <section class="methodology-section">
        <h2>Quality Thresholds</h2>

        <h3>Perfect Data Threshold</h3>
        <div class="threshold-box perfect-threshold">
          <h4>0.5 Pixel Accuracy (≈0.485″ for ASI 2600 MM Pro)</h4>
          <p>
            <strong>Rationale:</strong> Sub-pixel accuracy ensures star images remain sharp with minimal
            trailing. This represents exceptional guiding performance where stellar PSF (Point Spread Function)
            is limited primarily by atmospheric seeing rather than guiding errors.
          </p>
          <p>
            <strong>Application:</strong> Critical for high-resolution imaging, planetary photography,
            and when using long focal lengths or small pixel cameras.
          </p>
        </div>

        <h3>Good Data Threshold</h3>
        <div class="threshold-box good-threshold">
          <h4>1.0 Pixel Accuracy (≈0.970″ for ASI 2600 MM Pro)</h4>
          <p>
            <strong>Rationale:</strong> One-pixel accuracy provides excellent results for most astrophotography
            applications. Star trailing becomes barely perceptible, and image quality remains high for
            typical deep-sky imaging.
          </p>
          <p>
            <strong>Application:</strong> Suitable for most deep-sky astrophotography, nebula imaging,
            and galaxy photography with standard focal lengths.
          </p>
        </div>

        <h3>Threshold Derivation</h3>
        <p>These thresholds are calculated using the main imaging camera specifications:</p>
        <div class="formula">
          <code>
            Pixel Scale = (Pixel Size μm × 206,265) / Focal Length mm<br>
            Perfect Threshold = 0.5 × Pixel Scale<br>
            Good Threshold = 1.0 × Pixel Scale
          </code>
        </div>
      </section>

      <!-- Frame Recommendations Section -->
      <section class="methodology-section">
        <h2>Data-Driven Frame Recommendations</h2>

        <h3>Cross-Platform Data Correlation</h3>
        <p>
          Our frame recommendation system correlates PHD2 guiding data with ASIAIR imaging logs to provide
          precise, actionable recommendations for frame selection during post-processing.
        </p>

        <h3>Real Exposure Analysis</h3>
        <p>
          Unlike theoretical approaches that assume exposure durations, our system uses actual ASIAIR log data
          to identify the exact timing and duration of each light frame exposure:
        </p>
        <div class="formula">
          <code>
            For each ASIAIR light frame exposure:<br>
            1. Extract start time and integration duration<br>
            2. Find all PHD2 measurements during exposure period<br>
            3. Analyze guiding quality throughout exposure<br>
            4. Flag entire frame if ANY measurement exceeds thresholds
          </code>
        </div>

        <h3>Long Exposure Impact Principle</h3>
        <div class="threshold-box needs-improvement">
          <h4>Critical Insight: Brief Problems, Lasting Impact</h4>
          <p>
            Even 2-3 seconds of poor guiding during a 120-second exposure can cause star trailing
            across the entire frame. Our analysis identifies complete imaging frames that should be
            excluded from stacking, not just individual problematic guiding measurements.
          </p>
        </div>

        <h3>Imaging Camera Precision</h3>
        <p>
          Frame recommendations use imaging camera specifications rather than guide camera parameters:
        </p>
        <ul>
          <li><strong>Guide Camera:</strong> Used for tracking corrections (typically 2-4μm pixels)</li>
          <li><strong>Imaging Camera:</strong> Captures final images requiring precision analysis (typically 3-5μm pixels)</li>
          <li><strong>Quality Assessment:</strong> Based on imaging camera pixel scale for accurate thresholds</li>
        </ul>

        <h3>Recommendation Categories</h3>
        <p>
          The system identifies problematic frames based on multiple criteria:
        </p>
        <ul>
          <li><strong>Quality Threshold Violations:</strong> Errors exceeding 1.0 pixel tolerance</li>
          <li><strong>Large Error Events:</strong> Significant guiding corrections (>3 pixels)</li>
          <li><strong>Sudden Position Jumps:</strong> Rapid position changes indicating mount issues</li>
          <li><strong>Low SNR Periods:</strong> Poor star detection affecting guiding accuracy</li>
        </ul>

        <h3>Practical Implementation</h3>
        <p>
          Recommendations provide specific image numbers that correspond to your actual capture sequence.
          For example: "Drop Image #15, #23, #47" rather than generic time-based suggestions.
        </p>
      </section>

      <!-- Technical Considerations Section -->
      <section class="methodology-section">
        <h2>Technical Considerations</h2>

        <h3>Sampling Rate Impact</h3>
        <p>
          Higher sampling rates (shorter exposure times) provide more data points but may include
          more atmospheric noise. Our analysis considers the entire dataset without filtering
          to provide an unbiased view of actual guiding performance.
        </p>

        <h3>Scale Selection</h3>
        <p>
          Analysis can be performed in two scales:
        </p>
        <ul>
          <li><strong>Pixels:</strong> Raw camera coordinates, useful for mount/software debugging</li>
          <li><strong>Arc-seconds:</strong> Angular measurements, relevant for image quality assessment</li>
        </ul>
        <p>
          Quality metrics (Perfect/Good Data percentages) are only displayed in arc-second mode
          as they require angular context for meaningful interpretation.
        </p>

        <h3>Outlier Handling</h3>
        <p>
          No outlier filtering is applied to maintain data integrity. Large corrections often
          represent real events (wind gusts, mount backlash, seeing variations) that impact
          final image quality and should be included in quality assessments.
        </p>
      </section>

      <!-- Validation Section -->
      <section class="methodology-section">
        <h2>Validation & Accuracy</h2>

        <h3>Cross-Validation with CDF</h3>
        <p>
          The calculated quality percentages can be validated against the Cumulative Distribution
          Function chart. At the threshold values, the CDF should show percentages matching
          the Perfect/Good Data metrics.
        </p>

        <h3>Equipment-Specific Calibration</h3>
        <p>
          Quality assessments and frame recommendations automatically adjust for equipment specifications:
        </p>
        <ul>
          <li><strong>Imaging Camera:</strong> Pixel size and resolution for quality threshold calculations</li>
          <li><strong>Guide Camera:</strong> Used for PHD2 calibration and measurement scale</li>
          <li><strong>Telescope:</strong> Focal length for accurate pixel scale derivation</li>
          <li><strong>Binning Settings:</strong> Applied to effective pixel size calculations</li>
          <li><strong>Cross-Platform Integration:</strong> ASIAIR exposure timing with PHD2 guiding data</li>
        </ul>

        <h3>Limitations</h3>
        <ul>
          <li>Assumes linear relationship between guiding errors and image quality</li>
          <li>Does not account for atmospheric seeing conditions</li>
          <li>Thresholds are conservative estimates; actual tolerance may vary by target and conditions</li>
          <li>Frame recommendations require both PHD2 and ASIAIR log files for correlation</li>
          <li>Analysis accuracy depends on temporal synchronization between logs</li>
          <li>Limited to ASIAIR-compatible imaging platforms for frame-specific recommendations</li>
        </ul>
      </section>

      <!-- References Section -->
      <section class="methodology-section">
        <h2>References & Standards</h2>
        <ul>
          <li>
            <strong>PHD2 Documentation:</strong> 
            <a href="https://openphdguiding.org/" target="_blank">OpenPHDGuiding.org</a>
          </li>
          <li>
            <strong>Pixel Scale Calculation:</strong> 
            Standard astronomical formula using arc-second conversion factor (206,265)
          </li>
          <li>
            <strong>CCD Equation:</strong> 
            Angular pixel size = (pixel size × 206,265) / focal length
          </li>
          <li>
            <strong>Statistical Methods:</strong> 
            Standard RMS and cumulative distribution analysis
          </li>
        </ul>
      </section>

      <!-- Interpretation Guide -->
      <section class="methodology-section">
        <h2>Interpretation Guide</h2>

        <h3>Understanding Your Results</h3>
        <div class="interpretation-grid">
          <div class="interpretation-card excellent">
            <h4>Excellent Performance</h4>
            <p><strong>Perfect Data:</strong> &gt;40%</p>
            <p><strong>Good Data:</strong> &gt;80%</p>
            <p><strong>RMS Total:</strong> &lt;0.5″</p>
            <p>Exceptional guiding suitable for any imaging application.</p>
          </div>

          <div class="interpretation-card good">
            <h4>Good Performance</h4>
            <p><strong>Perfect Data:</strong> 15-40%</p>
            <p><strong>Good Data:</strong> 60-80%</p>
            <p><strong>RMS Total:</strong> 0.5-1.0″</p>
            <p>Solid performance for most deep-sky imaging projects.</p>
          </div>

          <div class="interpretation-card acceptable">
            <h4>Acceptable Performance</h4>
            <p><strong>Perfect Data:</strong> 5-15%</p>
            <p><strong>Good Data:</strong> 30-60%</p>
            <p><strong>RMS Total:</strong> 1.0-1.5″</p>
            <p>Adequate for casual imaging; consider improvements for critical work.</p>
          </div>

          <div class="interpretation-card needs-improvement">
            <h4>Needs Improvement</h4>
            <p><strong>Perfect Data:</strong> &lt;5%</p>
            <p><strong>Good Data:</strong> &lt;30%</p>
            <p><strong>RMS Total:</strong> &gt;1.5″</p>
            <p>Review mount, guiding setup, or environmental conditions.</p>
          </div>
        </div>

        <h3>Frame Recommendation Interpretation</h3>
        <div class="frame-rec-guide">
          <div class="rec-card low-impact">
            <h4>🟢 Minimal Impact (&lt;5% frames flagged)</h4>
            <p>Excellent guiding consistency. Very few frames need removal, indicating stable conditions and well-tuned equipment.</p>
          </div>
          
          <div class="rec-card moderate-impact">
            <h4>🟡 Moderate Impact (5-15% frames flagged)</h4>
            <p>Good overall performance with some problematic periods. Recommended frame removal will significantly improve final image quality.</p>
          </div>
          
          <div class="rec-card high-impact">
            <h4>🟠 High Impact (15-30% frames flagged)</h4>
            <p>Substantial guiding issues detected. Consider investigating mount, environmental conditions, or guiding parameters before next session.</p>
          </div>
          
          <div class="rec-card critical-impact">
            <h4>🔴 Critical Impact (&gt;30% frames flagged)</h4>
            <p>Severe guiding problems. Majority of frames compromised - review entire guiding setup, balance, and environmental factors.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// No specific logic needed for this documentation page
</script>

<style scoped>
.methodology-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-color);
}

.methodology-header {
  text-align: center;
  margin-bottom: 48px;
  padding: 32px 0;
  border-bottom: 2px solid var(--border-color);
}

.methodology-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 36px;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

.methodology-icon {
  font-size: 40px;
}

.methodology-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
}

.methodology-content {
  line-height: 1.7;
}

.methodology-section {
  margin-bottom: 48px;
}

.methodology-section h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 24px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
}

.methodology-section h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  margin: 32px 0 16px 0;
}

.methodology-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 16px 0 8px 0;
}

.methodology-section p {
  margin: 16px 0;
  color: var(--text-color);
}

.methodology-section ul {
  margin: 16px 0;
  padding-left: 24px;
}

.methodology-section li {
  margin: 8px 0;
  color: var(--text-color);
}

.formula {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-family: 'Courier New', monospace;
}

.formula code {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.6;
}

.threshold-box {
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  border-left: 4px solid;
}

.perfect-threshold {
  background: rgba(220, 38, 38, 0.1);
  border-left-color: #dc2626;
}

.good-threshold {
  background: rgba(22, 163, 74, 0.1);
  border-left-color: #16a34a;
}

.threshold-box h4 {
  color: var(--text-color);
  margin-top: 0;
}

.interpretation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.interpretation-card {
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid;
}

.excellent {
  background: rgba(34, 197, 94, 0.1);
  border-left-color: #22c55e;
}

.good {
  background: rgba(99, 102, 241, 0.1);
  border-left-color: #6366f1;
}

.acceptable {
  background: rgba(245, 158, 11, 0.1);
  border-left-color: #f59e0b;
}

.needs-improvement {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #ef4444;
}

.interpretation-card h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.interpretation-card p {
  margin: 8px 0;
  font-size: 14px;
}

/* Frame Recommendation Guide */
.frame-rec-guide {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.rec-card {
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.05);
}

.low-impact {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.moderate-impact {
  border-left-color: #eab308;
  background: rgba(234, 179, 8, 0.08);
}

.high-impact {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}

.critical-impact {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.rec-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.rec-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .methodology-page {
    padding: 16px;
  }
  
  .methodology-title {
    font-size: 28px;
    flex-direction: column;
    gap: 8px;
  }
  
  .methodology-section h2 {
    font-size: 24px;
  }
  
  .interpretation-grid {
    grid-template-columns: 1fr;
  }
  
  .frame-rec-guide {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
