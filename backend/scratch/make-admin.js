const http = require('http');

const data = JSON.stringify({
  secretKey: 'hms_super_secret_2026',
  firstName: 'Laxman',
  lastName: 'SuperAdmin',
  email: 'laxman@gmail.com',
  mobile: '1234567890',
  password: '123321'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/create-super-admin',
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
