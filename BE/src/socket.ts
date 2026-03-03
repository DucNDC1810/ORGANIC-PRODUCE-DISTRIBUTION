import { Server, Socket } from 'socket.io';
import http from 'http';

let io: Server;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Client gửi groupId để join vào room của nhóm đó
    socket.on('join-group-room', (groupId: string) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave-group-room', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io chưa được khởi tạo');
  return io;
}
