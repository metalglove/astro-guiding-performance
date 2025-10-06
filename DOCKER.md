# Docker Deployment Guide

This guide explains how to run the Astro Guiding Performance application using Docker Compose.

## Quick Start

### Development Mode (with hot reload)
```bash
# Run in development mode
docker-compose --profile dev up -d

# View logs
docker-compose logs -f agp-dev

# Stop
docker-compose --profile dev down
```

### Production Mode
```bash
# Build and run in production mode
docker-compose --profile prod up -d

# View logs
docker-compose logs -f agp-prod

# Stop
docker-compose --profile prod down
```

### Synology NAS Deployment
```bash
# Use environment variables for Synology-friendly ports
cp .env.example .env
# Edit .env to uncomment Synology ports (AGP_PROD_PORT=8081)
docker-compose --profile prod up -d
```

For detailed Synology deployment instructions, see [SYNOLOGY.md](./SYNOLOGY.md).

## Available Profiles

- `dev` - Development environment with hot reload
- `prod` - Production environment with nginx

## Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your specific configuration.

## Services

### agp-dev
- **Purpose**: Development server with hot reload
- **Port**: 8080
- **Features**: 
  - File watching for auto-reload
  - Source code mounted as volumes
  - Development optimized build

### agp-prod
- **Purpose**: Production server with nginx
- **Port**: 80
- **Features**:
  - Optimized production build
  - Nginx static file serving
  - Health checks
  - Automatic restart



## Local Development (Non-Docker)

If you prefer to run the application locally without Docker:

```bash
# Navigate to the app directory
cd web/agp

# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build

# Run linter
npm run lint
```

## Useful Docker Commands

```bash
# Build without cache
docker-compose build --no-cache

# View container status
docker-compose ps

# Execute commands in running container
docker-compose exec agp-dev sh

# View real-time logs
docker-compose logs -f

# Remove all containers and volumes
docker-compose down -v

# Update images
docker-compose pull
```

## File Structure

```
.
├── docker-compose.yml          # Main compose file
├── docker-compose.override.yml # Development overrides
├── .env.example               # Environment template
└── web/agp/
    ├── .Dockerfile           # Production Dockerfile
    └── Dockerfile.dev        # Development Dockerfile
```

## Troubleshooting

### Port Conflicts
If ports 80 or 8080 are already in use, modify the port mappings in your `.env` file:
```
AGP_DEV_PORT=3000
AGP_PROD_PORT=8080
```

### File Watching Issues (Windows/WSL)
For Windows users with WSL2, you may need to enable polling:
```
CHOKIDAR_USEPOLLING=true
```

### Container Build Issues
Clear Docker cache and rebuild:
```bash
docker system prune -a
docker-compose build --no-cache
```

### Package Manager
This project uses **npm** as the package manager. The Dockerfiles are configured to use:
- `package-lock.json` for dependency locking
- `npm ci` for faster, reliable builds in containers
- `npm run build` and `npm run serve` commands
- All yarn references have been removed from the project

## Performance Optimization

### Production
- Uses multi-stage builds for smaller images
- Static file serving with nginx
- Gzip compression enabled
- Cache headers configured

### Development
- Fast incremental builds
- Hot module replacement
- Source maps enabled
- Debug tools available