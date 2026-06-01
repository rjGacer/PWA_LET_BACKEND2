const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlJhaXphIEdhY2VyIiwicm9sZSI6InRlYWNoZXIiLCJpYXQiOjE3ODAyODkwMjZ9.cOy9hbcLd31Jkn6zkf9MCfcLbzu1CdxZJkZs8_1yHqQ';

const options = {
  hostname: '192.168.93.2',
  port: 5001,
  path: '/api/v1/subjects/12',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch(e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
