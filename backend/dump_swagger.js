const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'HMS API', version: '1.0.0' }
    },
    apis: [
        path.join(__dirname, 'src/modules/**/*.route.js').replace(/\\/g, '/'),
        path.join(__dirname, 'src/modules/**/*.routes.js').replace(/\\/g, '/')
    ],
};

const swaggerSpec = swaggerJsdoc(options);
fs.writeFileSync('swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('Dumped to swagger.json');
