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
            if (userId) {
                socket.join(userId.toString());
                console.log(`[SocketService] User ${userId} joined room.`);
            }
        });

        socket.on('join_session', (sessionId) => {
            if (sessionId) {
                socket.join(`session_${sessionId}`);
                console.log(`[SocketService] Socket ${socket.id} joined session_${sessionId}`);
            }
        });

        socket.on('leave_session', (sessionId) => {
            if (sessionId) {
                socket.leave(`session_${sessionId}`);
                console.log(`[SocketService] Socket ${socket.id} left session_${sessionId}`);
            }
        });

        socket.on('start_call', ({ toUserId, patientUserIds, appointment, callerName, type }) => {
            const targets = new Set();
            if (toUserId) targets.add(toUserId.toString());
            if (Array.isArray(patientUserIds)) {
                patientUserIds.forEach(id => id && targets.add(id.toString()));
            }
            if (appointment) {
                if (appointment.patient?._id) targets.add(appointment.patient._id.toString());
                if (appointment.patient?.user?._id) targets.add(appointment.patient.user._id.toString());
                if (appointment.patient?.user) targets.add(appointment.patient.user.toString());
                if (typeof appointment.patient === 'string') targets.add(appointment.patient);
            }

            targets.forEach(uid => {
                sendToUser(uid, 'incoming_call', {
                    appointment,
                    callerName,
                    type: type || 'video'
                });
            });
            console.log(`[SocketService] Emitted incoming_call from ${callerName} to targets:`, Array.from(targets));
        });

        socket.on('disconnect', () => {
            console.log(`[SocketService] Client disconnected: ${socket.id}`);
        });
    });
};

const sendToUser = (userId, eventName, data) => {
    if (io && userId) {
        io.to(userId.toString()).emit(eventName, data);
        console.log(`[SocketService] Emitted event '${eventName}' to user ${userId}`);
    } else if (!io) {
        console.error('[SocketService] Socket.io is not initialized');
    }
};

const sendToRoom = (roomName, eventName, data) => {
    if (io && roomName) {
        io.to(roomName.toString()).emit(eventName, data);
        console.log(`[SocketService] Emitted event '${eventName}' to room ${roomName}`);
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
    sendToRoom,
    getIo
};
