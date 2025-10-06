# Synology NAS Deployment Guide

## Overview
Your Astro Guiding Performance application can run excellently on Synology NAS using Docker Compose. Here's what you need to know:

## ✅ Requirements Met
- **Docker Support**: ✅ Synology DSM supports Docker via Container Manager
- **Static Files**: ✅ Your app is a Vue.js SPA that builds to static files
- **Lightweight**: ✅ Uses nginx alpine image (~50MB total)
- **Self-contained**: ✅ No external database or services required

## 🚀 Deployment Options

### Option 1: Direct Production Deploy (Recommended)
```bash
# On your Synology NAS
docker compose --profile prod up -d
```

### Option 2: Synology-Optimized Setup
Use the synology-specific compose file (see below)

## 📋 Synology-Specific Considerations

### Port Configuration
- **Default**: Uses port 80 (might conflict with Synology's web interface)
- **Recommended**: Use alternative ports like 8081
- **SSL**: Port 443 may conflict with Synology's SSL

### File Permissions
- nginx container runs with appropriate permissions by default
- No special user configuration needed for basic deployment

## 🔧 Synology-Optimized Configuration

### Option 1: Environment Variables (Recommended)
```bash
# Copy and edit environment file
cp .env.example .env

# Edit .env file to uncomment Synology settings:
# AGP_PROD_PORT=8081
# AGP_PROD_SSL_PORT=8443

# Deploy with standard compose file
docker compose --profile prod up -d
```

### Option 2: Custom Compose File Template
Create your own `docker-compose.synology.yml` for personal use:

```yaml
services:
  agp-synology:
    build:
      context: ./web/agp
      dockerfile: .Dockerfile
    container_name: astro-guiding-performance
    ports:
      - "8081:80"  # Avoid conflict with Synology web interface
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - agp-network
    labels:
      - "com.synology.description=Astro Guiding Performance Analysis Tool"
      - "com.synology.webui=http://[HOST]:8081"

networks:
  agp-network:
    driver: bridge
    name: agp-network
```

## 📱 Synology Container Manager Setup

### Method 1: Command Line (SSH)
1. SSH into your Synology NAS
2. Navigate to your project directory
3. Run: `docker compose --profile prod up -d`

### Method 2: Container Manager GUI
1. Open Container Manager in DSM
2. Go to Project tab
3. Create new project
4. Upload your docker-compose.yml
5. Configure and deploy

## 🌐 Access Configuration

### Internal Access
- **URL**: `http://[NAS-IP]:8081`
- **Example**: `http://192.168.1.100:8081`

### External Access (Optional)
1. **Port Forwarding**: Configure router to forward port 8081
2. **Dynamic DNS**: Use Synology DDNS or external service
3. **SSL**: Use Synology's built-in Let's Encrypt or reverse proxy

## 🔒 Security Recommendations

### Firewall
- Only open necessary ports
- Consider VPN access instead of direct internet exposure

### Updates
```bash
# Update the container
docker compose pull
docker compose --profile prod up -d
```

### Backup
- Container images are rebuilt from source
- Consider backing up any logs or custom configurations

## 🎯 Performance Expectations

### Resource Usage
- **CPU**: Minimal (static file serving)
- **RAM**: ~50-100MB
- **Storage**: ~100MB for container + source files

### Synology Model Compatibility
- **Compatible**: All models with Docker support (DS218+, DS920+, etc.)
- **Performance**: Excellent for static file serving

## 🚀 Quick Start Commands

```bash
# Clone/copy project to Synology
git clone [your-repo] /volume1/docker/astro-guiding-performance

# Navigate to project
cd /volume1/docker/astro-guiding-performance

# Deploy
docker compose --profile prod up -d

# Check status
docker compose ps

# View logs
docker compose logs -f agp-prod

# Stop
docker compose --profile prod down
```

## 🔍 Troubleshooting

### Port Conflicts
If port 80 is taken:
```bash
# Edit docker-compose.yml to use different port
ports:
  - "8081:80"
```

### Permission Issues
Check Synology user/group IDs:
```bash
id [your-username]
```

### Container Manager Integration
- Import the project via Container Manager GUI
- Use the "Project" feature for easier management
- Enable auto-restart for reliability

## 📊 Monitoring

### Health Checks
The container includes built-in health checks that Synology Container Manager can display.

### Logs
Access logs through:
- Container Manager GUI
- Command line: `docker compose logs`
- Mounted volume (if configured)

---

**Recommendation**: The current production setup will work perfectly on Synology NAS. Just change the port mapping to avoid conflicts with Synology's web interface.