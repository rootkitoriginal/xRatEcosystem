// Set up environment variables for testing bulk delete operations with notifications

// Make sure we have bulk created IDs to delete
let bulkIds;
try {
  bulkIds = JSON.parse(pm.environment.get('bulkCreatedIds') || '[]');
} catch (e) {
  bulkIds = [];
}

if (!bulkIds.length) {
  console.warn('No bulk created IDs found. Please run the bulk create operation first.');
}

// Prepare bulk operation data for deletion
const bulkDeleteData = {
  operation: 'delete',
  data: bulkIds.map((id) => ({ id })),
};

// Set the request body
pm.variables.set('bulkDeletePayload', JSON.stringify(bulkDeleteData));

// Log preparation for debugging
console.log(
  'Prepared bulk delete operation payload for',
  bulkDeleteData.data.length,
  'items:',
  bulkIds.join(', ')
);
