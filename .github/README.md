# GitHub Actions Workflows

This directory contains GitHub Actions workflows for production deployment.

## Workflows Overview

### Deploy to Production (`deploy-production.yml`)
- **Triggers**: Push to `main` branch, manual dispatch
- **Purpose**: Deploy to production environment
- **Features**:
  - Uses SSH to connect to production server
  - Backs up current image before deployment
  - Stops existing containers
  - Pulls latest code from `main` branch
  - Builds new Docker image
  - Starts containers with health checks
  - Performs comprehensive health checks
  - Cleans up old Docker resources

## Required Secrets

Configure the following secrets in your GitHub repository settings:

### SSH Connection
- `SSH_PRIVATE_KEY`: Private SSH key for server access
- `SSH_KNOWN_HOSTS`: Server's SSH host key
- `SSH_USER`: SSH username
- `SSH_HOST`: Server hostname or IP address

### Environment Paths
- `PROJECT_PATH`: Production server project directory path

### Application Ports
- `APP_PORT`: Production application port

## Environment Protection

The production deployment uses GitHub Environments for additional protection:
- **Production**: Can be configured to require manual approval before deployment

## Migration from GitLab CI

This GitHub Actions setup replaces the previous GitLab CI configuration with the following improvements:

1. **Better Integration**: Native GitHub integration
2. **Enhanced Security**: Built-in secret management and environment protection
3. **Improved Monitoring**: Better visibility into workflow runs and logs
4. **Flexible Triggers**: Support for manual dispatch
5. **Image Backup**: Automatic backup of current image before deployment

## Usage

### Automatic Deployments
- Push to `main` → Triggers production deployment

### Manual Deployments
- Go to Actions tab → Select "Deploy to Production" → Click "Run workflow"

## Monitoring

- View workflow runs in the Actions tab
- Check deployment status and logs
- Monitor container health and resource usage
