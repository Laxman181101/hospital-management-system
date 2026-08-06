const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production to match your frontend URL
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SocketService] New client connected: ${socket.id}`);

        // A user joins their personal room after authenticating on the frontend
        socket.on('join_room', (userId) => {
            socket.join(userId);
            console.log(`[SocketService] User ${userId} joined their personal room.`);
        });

        socket.on('disconnect', () => {
            console.log(`[SocketService] Client disconnected: ${socket.id}`);
        });
    });
};

const sendToUser = (userId, eventName, data) => {
    if (io) {
        io.to(userId.toString()).emit(eventName, data);
        console.log(`[SocketService] Emitted event '${eventName}' to user ${userId}`);
    } else {
        console.error('[SocketService] Socket.io is not initialized');
    }
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initSocket,
    sendToUser,
    getIo
};
