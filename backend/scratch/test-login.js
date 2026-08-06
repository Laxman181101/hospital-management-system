const http = require('http');

const data = JSON.stringify({
  loginId: 'laxman@gmail.com',
  password: '123321'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
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
    console.log('Login Status:', res.statusCode);
    const parsed = JSON.parse(responseData);
    console.log('Login Response:', parsed);
    
    if (parsed.tokens && parsed.tokens.accessToken) {
      const getOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/pending-admins',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + parsed.tokens.accessToken
        }
      };
      const getReq = http.request(getOptions, (getRes) => {
        let getData = '';
        getRes.on('data', d => getData += d);
        getRes.on('end', () => console.log('GET Status:', getRes.statusCode, 'Data:', getData));
      });
      getReq.end();
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
