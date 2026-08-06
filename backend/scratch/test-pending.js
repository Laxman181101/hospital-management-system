const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/pending-admins',
  method: 'GET',
  headers: {
    // Super admin token is needed. We can just use the login script to get one first.
  }
};
