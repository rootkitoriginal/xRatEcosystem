const { execSync } = require('child_process');
const path = require('path');

/**
 * Global setup for E2E tests
 * Starts Docker Compose services before running tests
 */
async function globalSetup() {
  console.log('🚀 Starting E2E test environment...');

  const composePath = path.join(__dirname, 'docker-compose.e2e.yml');

  try {
    // Stop any existing E2E containers
    console.log('🧹 Cleaning up any existing E2E containers...');
    execSync('docker compose -f ' + JSON.stringify(composePath) + ' down -v --remove-orphans', {
      stdio: 'inherit',
      timeout: 60000,
      shell: '/bin/bash',
    });

    // Start E2E services
    console.log('🐳 Starting E2E Docker containers...');
    execSync('docker compose -f ' + JSON.stringify(composePath) + ' up -d --build', {
      stdio: 'inherit',
      timeout: 300000,
      shell: '/bin/bash',
    });

    // Wait for services to be healthy
    console.log('⏳ Waiting for services to be healthy...');
    const maxAttempts = 60;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const result = execSync('docker compose -f ' + JSON.stringify(composePath) + ' ps --format json', {
          encoding: 'utf8',
          timeout: 10000,
          shell: '/bin/bash',
        });

        const services = result
          .trim()
          .split('\n')
          .filter((line) => line)
          .map((line) => JSON.parse(line));

        const allHealthy = services.every((service) => {
          const health = service.Health || 'healthy';
          return health === 'healthy' || service.State === 'running';
        });

        if (allHealthy) {
          console.log('✅ All services are healthy!');
          break;
        }

        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (attempt >= maxAttempts) {
      throw new Error('Services failed to become healthy in time');
    }

    // Additional wait for services to fully initialize
    console.log('⏳ Waiting for services to fully initialize...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('✅ E2E environment ready!');
  } catch (error) {
    console.error('❌ Failed to start E2E environment:', error.message);
    
    // Show logs for debugging
    try {
      console.log('\n📋 Container logs:');
      execSync('docker compose -f ' + JSON.stringify(composePath) + ' logs --tail=50', {
        stdio: 'inherit',
        shell: '/bin/bash',
      });
    } catch (logError) {
      console.error('Could not fetch logs:', logError.message);
    }

    throw error;
  }
}

module.exports = globalSetup;
