// Set up environment variables for testing bulk operations
const timestamp = Date.now();

// Generate unique names for bulk items
pm.environment.set('bulkItem1Name', `Bulk Item 1 ${timestamp}`);
pm.environment.set('bulkItem2Name', `Bulk Item 2 ${timestamp}`);

// Prepare bulk operation data for creation
const bulkCreateData = {
  operation: 'create',
  data: [
    {
      name: pm.environment.get('bulkItem1Name'),
      type: 'bulk-test',
      content: 'This is the first bulk test item',
    },
    {
      name: pm.environment.get('bulkItem2Name'),
      type: 'bulk-test',
      content: 'This is the second bulk test item',
    },
  ],
};

// Set the request body
pm.variables.set('bulkOperationPayload', JSON.stringify(bulkCreateData));

// Log preparation for debugging
console.log('Prepared bulk create operation payload with', bulkCreateData.data.length, 'items');
