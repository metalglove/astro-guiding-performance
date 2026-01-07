# Star Catalog Selection for Phase 3.3

## Decision: Hipparcos Catalog (Reduced Subset)

**Date**: January 7, 2026  
**Context**: Selecting star catalog for realistic star field rendering in imaging camera view

---

## Requirements

1. **Coverage**: Sufficient stars visible to naked eye and through telescope
2. **File Size**: Reasonable download/bundle size (<20 MB)
3. **Accuracy**: Accurate positions for visual realism
4. **License**: Public domain or permissive license
5. **Format**: Easy to parse and integrate
6. **Performance**: Fast rendering in WebGL/Three.js

---

## Evaluated Options

### Option 1: Tycho-2 Catalog
- **Stars**: ~2.5 million
- **Magnitude**: Down to ~12.5
- **File Size**: ~400 MB (full catalog)
- **Pros**: Very comprehensive, accurate positions
- **Cons**: Too large for web application, overkill for visualization
- **Verdict**: ❌ **Rejected** - File size too large

### Option 2: GAIA DR3
- **Stars**: ~1.8 billion
- **Magnitude**: Down to ~21
- **File Size**: Multiple TB (full catalog)
- **Pros**: Most accurate modern catalog
- **Cons**: Extremely large, requires complex querying infrastructure
- **Verdict**: ❌ **Rejected** - Impractical for client-side web app

### Option 3: Yale Bright Star Catalog (BSC5)
- **Stars**: ~9,110
- **Magnitude**: Down to ~6.5 (naked eye limit)
- **File Size**: ~2 MB
- **Pros**: Small, fast, covers all naked-eye stars
- **Cons**: Too sparse for telescope view simulation
- **Verdict**: ⚠️ **Partial** - Good for overview, insufficient for detail

### Option 4: Hipparcos Catalog ✅ **SELECTED**
- **Stars**: ~118,000
- **Magnitude**: Down to ~12.5
- **File Size**: ~10-15 MB (full), ~5 MB (reduced to mag 10)
- **Pros**: 
  - Perfect balance of coverage and size
  - Public domain (ESA data)
  - Well-documented format
  - Accurate positions and proper motions
  - Covers all stars visible in small telescopes
  - Widely used in planetarium software
- **Cons**: 
  - Not as deep as Tycho-2
  - Requires parsing binary or CSV format
- **Verdict**: ✅ **SELECTED** - Optimal for web application

---

## Implementation Plan

### Phase 1: Magnitude-Filtered Subset
**Initial Implementation**: Hipparcos stars down to magnitude 8.0
- **Stars**: ~12,000 stars
- **File Size**: ~1-2 MB JSON
- **Rationale**: Covers all prominent stars, fast loading, proof of concept

### Phase 2: Extended Catalog
**Future Enhancement**: Hipparcos stars down to magnitude 10.0
- **Stars**: ~50,000 stars
- **File Size**: ~5 MB JSON
- **Rationale**: Adds fainter stars for realism

### Phase 3: Full Catalog (Optional)
**Advanced Feature**: Full Hipparcos to magnitude 12.5
- **Stars**: ~118,000 stars
- **File Size**: ~15 MB JSON
- **Rationale**: Complete coverage, may require lazy loading or binary format

---

## Data Format

### Source Data
**Hipparcos Main Catalog** (hip_main.dat)
- Available from: CDS Strasbourg (VizieR)
- Format: Fixed-width text file
- URL: http://cdsarc.u-strasbg.fr/viz-bin/Cat?I/239

### Processed Format (JSON)
```json
{
  "metadata": {
    "catalog": "Hipparcos",
    "version": "1.0",
    "magnitude_limit": 8.0,
    "star_count": 12000,
    "epoch": "J2000.0"
  },
  "stars": [
    {
      "id": 677,
      "ra": 0.0025,
      "dec": 1.0892,
      "mag": 2.02,
      "bv": 0.09,
      "name": "Alpheratz"
    }
  ]
}
```

### Binary Format (Future Optimization)
```
Header (32 bytes):
- Magic number (4 bytes): "HIPS"
- Version (4 bytes): 1
- Star count (4 bytes): 12000
- Magnitude limit (4 bytes float): 8.0
- Reserved (16 bytes)

Star Records (16 bytes each):
- RA (4 bytes float): hours (0-24)
- Dec (4 bytes float): degrees (-90 to +90)
- Magnitude (4 bytes float): visual magnitude
- Color B-V (4 bytes float): color index
```

**Advantage**: ~12,000 stars × 16 bytes = 192 KB (vs 1-2 MB JSON)

---

## Data Fields

### Required Fields
1. **HIP ID**: Hipparcos catalog number (unique identifier)
2. **RA (J2000)**: Right Ascension in hours (0-24)
3. **Dec (J2000)**: Declination in degrees (-90 to +90)
4. **V Magnitude**: Visual magnitude (brightness)
5. **B-V**: Color index (for star color rendering)

### Optional Fields (Future)
6. **Proper Motion**: RA/Dec motion (for epoch correction)
7. **Parallax**: Distance measurement (for 3D rendering)
8. **Common Name**: Star names (Sirius, Vega, etc.)
9. **Spectral Type**: Star classification (for accurate colors)

---

## Rendering Strategy

### Magnitude-Based Sizing
```typescript
function getStarSize(magnitude: number): number {
  // Brighter stars (lower magnitude) appear larger
  const baseSizePx = 2.0;
  const scaleFactor = Math.pow(2.512, -magnitude / 2.5);
  return baseSizePx * scaleFactor;
}
```

### Color Rendering (B-V Index)
```typescript
function getStarColor(bv: number): string {
  // B-V ranges from -0.4 (blue) to +2.0 (red)
  if (bv < 0.0) return '#9BB0FF'; // Blue
  if (bv < 0.3) return '#CAD7FF'; // Blue-white
  if (bv < 0.6) return '#F8F7FF'; // White
  if (bv < 1.0) return '#FFD2A1'; // Yellow-white
  if (bv < 1.5) return '#FFCC6F'; // Orange
  return '#FF9329'; // Red
}
```

### Level of Detail (LOD)
```typescript
function shouldRenderStar(magnitude: number, cameraFOV: number): boolean {
  // Show fewer stars as FOV increases (zoomed out)
  const magLimit = 6.0 + (60 - cameraFOV) / 10;
  return magnitude <= magLimit;
}
```

---

## Performance Considerations

### Initial Render Performance
- **12,000 stars**: ~16ms on modern GPU (WebGL points)
- **50,000 stars**: ~60ms
- **118,000 stars**: ~150ms

### Optimization Techniques
1. **Instanced Rendering**: Render all stars in single draw call
2. **View Frustum Culling**: Only render stars in camera view
3. **Magnitude Culling**: Fade out faint stars when zoomed out
4. **Point Sprites**: Use GPU-rendered point sprites instead of meshes
5. **Web Worker**: Parse catalog in background thread

### Memory Usage
- **12,000 stars** × 5 floats × 4 bytes = 240 KB GPU memory
- **50,000 stars** = 1 MB GPU memory
- **118,000 stars** = 2.36 MB GPU memory

**Verdict**: All variants fit easily in GPU memory

---

## Licensing

**Hipparcos Catalog**: Public domain
- **Source**: European Space Agency (ESA)
- **License**: Free for scientific and commercial use
- **Attribution**: "This work has made use of data from the European Space Agency (ESA) mission Gaia"
- **URL**: https://www.cosmos.esa.int/web/hipparcos

---

## Alternative: Hybrid Approach

**Bright Stars (mag < 6)**: Yale BSC (~9,000 stars, ~2 MB)  
**+**  
**Faint Stars (mag 6-10)**: Hipparcos subset (~40,000 stars, ~4 MB)

**Total**: ~50,000 stars, ~6 MB

**Advantage**: Best of both worlds - accurate bright star names + deep coverage  
**Disadvantage**: Two data sources, more complex processing

**Verdict**: Single Hipparcos source preferred for consistency

---

## Data Preparation Pipeline

### Step 1: Download Hipparcos Catalog
```bash
wget http://cdsarc.u-strasbg.fr/ftp/cats/I/239/hip_main.dat.gz
gunzip hip_main.dat.gz
```

### Step 2: Parse and Filter (Python Script)
```python
import pandas as pd

# Read fixed-width format
hip = pd.read_fwf('hip_main.dat', ...)

# Filter by magnitude
hip_bright = hip[hip['Vmag'] <= 8.0]

# Export to JSON
hip_bright.to_json('hipparcos_mag8.json', orient='records')
```

### Step 3: Optimize for Web
```typescript
// Convert to compact binary format
// Or compress JSON with gzip (built-in browser support)
```

---

## Conclusion

**Selected**: Hipparcos Catalog (magnitude 8.0 subset for Phase 1)

**Rationale**:
- ✅ Perfect balance of coverage and file size
- ✅ Public domain, well-documented
- ✅ Sufficient for realistic star field rendering
- ✅ Proven in planetarium software (Stellarium, Celestia)
- ✅ Future extensibility to mag 10 or mag 12.5

**Next Steps**:
1. Download and process Hipparcos catalog
2. Create JSON format with magnitude 8.0 filter
3. Implement star catalog loader utility
4. Create star rendering system in Three.js
5. Integrate with imaging camera view

---

**References**:
- Hipparcos Catalog: https://www.cosmos.esa.int/web/hipparcos
- VizieR: http://cdsarc.u-strasbg.fr/viz-bin/Cat?I/239
- Stellarium (uses Hipparcos): https://stellarium.org/
- Three.js Points: https://threejs.org/docs/#api/en/objects/Points
