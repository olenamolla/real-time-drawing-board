// 📁 server/app.js
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((_, res) =>
  res.writeHead(200).end("Socket.IO server is running")
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});

// List of rooms and drawing history of each room
const roomHistories = {}; // { roomId: [drawingEvents] }

io.on("connection", (socket) => {
  const roomId = socket.handshake.query.roomId;

  if (roomId) {
    socket.join(roomId);
    if (!roomHistories[roomId]) roomHistories[roomId] = [];
  }

  // Create new room as requested by client
  socket.on("create-room", (roomCode, callback) => {
    if (!roomHistories[roomCode]) {
      roomHistories[roomCode] = [];
      console.log("📌 Room created:", roomCode);
    }
    callback();
  });

  // Check if room exists
  socket.on("check-room", (roomCode, callback) => {
    const exists = !!roomHistories[roomCode];
    callback(exists);
  });

  socket.on("request-history", () => {
    if (roomId && roomHistories[roomId]) {
      socket.emit("history", roomHistories[roomId]);
    }
  });

  socket.on("start", (data) => {
    if (!roomId) return;
    const event = { ...data, id: socket.id, type: "start" };
    roomHistories[roomId].push(event);
    socket.to(roomId).emit("start", event);
  });

  socket.on("draw", (data) => {
    if (!roomId) return;
    const event = { ...data, id: socket.id, type: "draw" };
    roomHistories[roomId].push(event);
    socket.to(roomId).emit("draw", event);
  });

  socket.on("end", () => {
    if (!roomId) return;
    const event = { id: socket.id, type: "end" };
    roomHistories[roomId].push(event);
    socket.to(roomId).emit("end", event);
  });

  socket.on("clear", () => {
    if (!roomId) return;
    roomHistories[roomId] = [];
    io.to(roomId).emit("clear");
  });
});

server.listen(8080, () => {
  console.log("🚀 Socket.IO server is running on http://localhost:8080");
});
