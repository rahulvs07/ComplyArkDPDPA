const http = require('http');

// Test the DPR update functionality
async function testDPRUpdate() {
  console.log('Testing DPR update functionality...');
  
  // First, add a test DPR request to organization 33
  const testRequest = {
    organizationId: 33,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '1234567890',
    requestType: 'Access',
    requestComment: 'Test request for update functionality',
    statusId: 35, // Submitted status
    assignedToUserId: null,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
    completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completedOnTime: null,
    closedDateTime: null,
    closureComments: null
  };

  // Simulate adding the request directly to storage
  console.log('Adding test DPR request...');
  
  // Test the update endpoint with a valid request ID
  const updateData = JSON.stringify({
    statusId: 36, // Change to InProgress
    comments: 'Testing update functionality'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dpr/1', // Test with request ID 1
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData),
      'Cookie': 'connect.sid=s%3AyourSessionCookie'
    }
  };

  console.log('Testing DPR update endpoint...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Update response status:', res.statusCode);
      console.log('Update response:', data);
      
      if (res.statusCode === 200) {
        console.log('✓ DPR update functionality is working');
      } else if (res.statusCode === 404) {
        console.log('✗ Request not found (expected - no test data)');
      } else if (res.statusCode === 401) {
        console.log('✗ Authentication required');
      } else {
        console.log('✗ DPR update failed with status:', res.statusCode);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(updateData);
  req.end();
}

testDPRUpdate();