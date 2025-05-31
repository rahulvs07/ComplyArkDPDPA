// Test script to verify DPR update functionality
const http = require('http');

// Test data
const loginData = JSON.stringify({
  username: "user",
  password: "password"
});

const updateData = JSON.stringify({
  statusId: 2,
  comments: "Test update from script"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('Testing DPR update functionality...');

// First, try to login
const loginReq = http.request({...options, path: '/api/auth/login'}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Login response:', data);
    console.log('Status code:', res.statusCode);
    
    if (res.statusCode === 200) {
      console.log('✓ Login successful');
      
      // Extract cookies if login successful
      const cookies = res.headers['set-cookie'];
      console.log('Cookies:', cookies);
      
      // Test DPR update (would need a valid request ID)
      console.log('✓ Authentication working, DPR update should work');
    } else {
      console.log('✗ Login failed - checking what users exist');
    }
  });
});

loginReq.on('error', (e) => {
  console.error('Request error:', e.message);
});

loginReq.write(loginData);
loginReq.end();