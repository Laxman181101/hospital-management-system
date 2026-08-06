const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger Configuration Options
const options = {
    definition: {
        openapi: '3.0.0', // OpenAPI version
        info: {
            title: 'Hospital Management System (HMS) API',
            version: '1.0.0',
            description: 'API Documentation for the Hospital Management System application.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: '/', // Relative path so it works on any IP/device (e.g. mobile testing)
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format Bearer <token>',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token to access protected routes',
                },
            },
        },
        security: [
            { bearerAuth: [] },
            { BearerAuth: [] }
        ],
    },
    // Files where Swagger should look for API comments
    apis: [
        require('path').join(__dirname, '../modules/**/*.route.js').replace(/\\/g, '/'),
        require('path').join(__dirname, '../modules/**/*.routes.js').replace(/\\/g, '/'),
        require('path').join(__dirname, '../app.js').replace(/\\/g, '/')
    ], 
};

// Initialize Swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    // Serve the Swagger UI at the '/api-docs' route
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
