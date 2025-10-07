const { execSync } = require('child_process');
const path = require('path');

/**
 * Global teardown for E2E tests
 * Stops and cleans up Docker Compose services after tests
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  const composePath = path.join(__dirname, 'docker-compose.e2e.yml');

  try {
    // Keep containers running if E2E_KEEP_CONTAINERS is set (for debugging)
    if (process.env.E2E_KEEP_CONTAINERS === 'true') {
      console.log('⚠️  Keeping containers running for debugging (E2E_KEEP_CONTAINERS=true)');
      console.log('To stop manually, run:');
      console.log('docker compose -f ' + JSON.stringify(composePath) + ' down -v');
      return;
    }

    // Stop and remove containers
    execSync('docker compose -f ' + JSON.stringify(composePath) + ' down -v --remove-orphans', {
      stdio: 'inherit',
      timeout: 60000,
      shell: '/bin/bash',
    });

    console.log('✅ E2E environment cleaned up!');
  } catch (error) {
    console.error('❌ Failed to clean up E2E environment:', error.message);
    throw error;
  }
}

module.exports = globalTeardown;
