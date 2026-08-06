require('dotenv').config();
const dns = require('dns');

// Override local DNS resolver with Google and Cloudflare DNS to fix MongoDB Atlas SRV query issues
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('Failed to set custom DNS servers:', err.message);
}

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const socketService = require('./src/services/socket.service');
const cronService = require('./src/services/cron.service');

// Create HTTP Server for Socket.io
const server = http.createServer(app);

// Connect to MongoDB and start the server
connectDB().then(() => {
    // Initialize Socket.io
    socketService.initSocket(server);
    
    // Initialize Cron Jobs
    cronService.initCronJobs();

    server.listen(env.port, () => {
        console.log(`Server is running on port ${env.port}`);
        console.log(`Swagger UI is available at http://localhost:${env.port}/api-docs`);
    });
});
