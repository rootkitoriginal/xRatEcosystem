// Set up environment variables for testing notification updates
const timestamp = Date.now();

// Make sure we have a data ID to update
const dataId = pm.environment.get('createdDataId');
if (!dataId) {
  console.warn('No data ID found. Please run the create data request first.');
}

// Prepare update payload with updated name
const updatedName = `Updated Data ${timestamp}`;
pm.environment.set('updatedDataName', updatedName);

const updateData = {
  name: updatedName,
  status: 'updated',
  metadata: {
    updatedBy: 'postman-test',
    timestamp: timestamp,
  },
};

// Set the request body
pm.variables.set('updateDataPayload', JSON.stringify(updateData));

// Log preparation
console.log(`Preparing to update data ID: ${dataId} with name: ${updatedName}`);
