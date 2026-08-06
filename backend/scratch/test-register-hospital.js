const http = require('http');

const data = JSON.stringify({
  hospitalName: 'Apollo Care Demo',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john2@apollocare.com',
  mobile: '9876543211',
  password: '123456',
  role: 'hospital_admin'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
