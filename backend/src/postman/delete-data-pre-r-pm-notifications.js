// Set up environment variables for testing delete notifications

// Make sure we have a data ID to delete
const dataId = pm.environment.get('createdDataId');
if (!dataId) {
  console.warn('No data ID found. Please run the create data request first.');
}

// Log preparation
console.log(`Preparing to delete data ID: ${dataId}`);
