# Astro Guiding Performance Analysis

🔭 **A comprehensive tool for analyzing PHD2 autoguiding performance in astrophotography**

This application provides quantitative analysis of PHD2 guiding logs to help astrophotographers evaluate their autoguiding performance and optimize their imaging setup. The tool transforms raw guiding data into meaningful metrics that directly relate to image quality potential.

**Live Demo:** https://astro-boys.nl

## 🚀 Features

- **📊 Comprehensive Statistical Analysis**: RMS error calculations, percentile analysis, and cumulative distribution functions
- **🎯 Quality Threshold Analysis**: Dual-threshold system for "Perfect" (sub-pixel) and "Good" (1-pixel) data classification  
- **📈 Interactive Visualizations**: Real-time charts with Chart.js integration, including enhanced CDF with threshold visualization
- **⚙️ Equipment Management**: Profile-based telescope and camera specifications for accurate pixel scale calculations
- **📱 Responsive Design**: Modern Vue 3 application with mobile-friendly interface
- **🔬 Scientific Methodology**: Transparent calculation methods with comprehensive documentation

## 📸 Example Analysis

Upload the sample files from the `data/` directory to see the analysis in action:

![Analysis Example](images/example_text.png)
![Chart Example](images/example.png)

## 🧮 Analysis Methodology

### Data Processing Pipeline

1. **Input Processing**: PHD2 guide logs with time-series correction data (dx, dy in pixels)
2. **Coordinate Transformation**: Convert pixel coordinates to angular measurements using equipment specifications
3. **Statistical Analysis**: Calculate RMS errors, percentiles, and cumulative distributions
4. **Quality Assessment**: Apply dual-threshold analysis for performance classification

### Mathematical Foundation

#### Pixel Scale Calculation
```
Pixel Scale (″/px) = (Pixel Size μm × 206,265) / Focal Length mm
```

#### Angular Error Conversion
```
Error (arcseconds) = Error (pixels) × Pixel Scale × Binning Factor
```

#### RMS Error Calculation
```
RMS = √(Σ(error²) / n)
```
Calculated separately for RA, Dec, and combined total accuracy.

### Quality Thresholds

#### Perfect Data Threshold: 0.5 Pixels
- **Rationale**: Sub-pixel accuracy ensures minimal star trailing
- **Application**: Critical for high-resolution imaging and long focal lengths
- **Typical Range**: 15-25% for well-tuned systems

#### Good Data Threshold: 1.0 Pixel  
- **Rationale**: One-pixel accuracy suitable for most astrophotography
- **Application**: Excellent for standard deep-sky imaging
- **Typical Range**: 60-80% for properly configured systems

### Equipment-Specific Calibration

The analysis automatically adjusts calculations based on:
- **Camera Specifications**: Pixel size, resolution, binning settings
- **Telescope Setup**: Focal length for accurate pixel scale
- **Guide vs. Main Camera**: Separate calculations for imaging and guiding systems

Example for ASI 2600 MM Pro (3.76μm pixels) with 800mm Newtonian:
- Pixel Scale: 0.970″/pixel
- Perfect Threshold: 0.485″
- Good Threshold: 0.970″

## 🎯 Performance Interpretation

### Excellent Performance (>40% Perfect, >80% Good)
- **RMS Total**: <0.5″
- **Characteristics**: Exceptional guiding suitable for any application
- **Recommendations**: System is well-optimized

### Good Performance (15-40% Perfect, 60-80% Good)  
- **RMS Total**: 0.5-1.0″
- **Characteristics**: Solid performance for most projects
- **Recommendations**: Minor optimizations may yield improvements

### Acceptable Performance (5-15% Perfect, 30-60% Good)
- **RMS Total**: 1.0-1.5″
- **Characteristics**: Adequate for casual imaging
- **Recommendations**: Consider mount, guiding, or environmental improvements

### Needs Improvement (<5% Perfect, <30% Good)
- **RMS Total**: >1.5″
- **Characteristics**: Significant issues affecting image quality
- **Recommendations**: Systematic review of entire guiding setup required

## 🔧 Technical Implementation

### Frontend Architecture
- **Framework**: Vue 3 with Composition API and TypeScript
- **Charts**: Chart.js with custom CDF enhancements
- **State Management**: Vuex for application state
- **Styling**: Custom CSS with CSS variables for theming
- **Build Tool**: Vue CLI with modern JavaScript features

### Key Components

#### PHDLogGuidingCharts.vue
- Enhanced CDF visualization with threshold lines
- Interactive charts with zoom functionality focused on 0-2″ error range
- Real-time statistical calculations

#### ChartStatistics.vue  
- Perfect/Good data percentage cards
- Conditional rendering based on scale selection
- Equipment-aware threshold calculations

#### Equipment.vue
- Profile management system with import/export
- Local state management for equipment specifications
- Integration with pixel scale calculations throughout the application

### Data Validation & Accuracy

#### Cross-Validation
- CDF chart percentages validate calculated quality metrics
- Threshold lines in CDF provide visual confirmation of analysis accuracy
- No data filtering applied to maintain integrity of actual performance

#### Limitations & Considerations
- Assumes linear relationship between guiding errors and image quality
- Conservative thresholds; actual tolerance may vary by conditions
- Analysis limited by quality of PHD2 calibration data
- Does not account for atmospheric seeing variations

## 🛠️ Development Setup

### Prerequisites
- Node.js 14+ and npm/yarn
- Modern web browser with ES2020+ support

### Installation
```bash
cd web/agp
npm install
npm run serve
```

### Building for Production
```bash
npm run build
```

## 📁 Project Structure

```
├── data/                          # Sample PHD2 and ASIAIR log files
├── images/                        # Documentation screenshots
├── web/agp/                       # Vue.js application
│   ├── src/
│   │   ├── components/            # Reusable Vue components
│   │   │   ├── GuidingPerformance.vue
│   │   │   ├── PHDLogGuidingCharts.vue
│   │   │   ├── ChartStatistics.vue
│   │   │   └── File/              # File upload components
│   │   ├── views/                 # Page components
│   │   │   ├── PHDLogViewer.vue   # Main analysis interface
│   │   │   ├── Equipment.vue      # Equipment management
│   │   │   ├── Methodology.vue    # Documentation page
│   │   │   └── Home.vue
│   │   ├── services/              # Data processing logic
│   │   │   ├── PHDLogReader.ts    # PHD2 log parsing
│   │   │   └── ASIAIRLogReader.ts # ASIAIR log parsing
│   │   ├── store/                 # Vuex state management
│   │   └── utilities/             # Helper functions
│   └── public/                    # Static assets
└── README.md                      # This file
```

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:
- Additional statistical measures (e.g., Allan variance)
- Support for other guiding software logs
- Advanced filtering and outlier detection
- Integration with plate solving for drift analysis
- Mobile application development

## 📚 References

- **PHD2 Guiding**: [OpenPHDGuiding.org](https://openphdguiding.org/)
- **Pixel Scale Formula**: Standard astronomical CCD equation
- **Statistical Methods**: Classical RMS and cumulative distribution analysis
- **Astrophotography Best Practices**: Sub-pixel guiding requirements

## 📄 License

This project is open source. Please contribute improvements and report issues.

---

**Developed for the astrophotography community** 🌌