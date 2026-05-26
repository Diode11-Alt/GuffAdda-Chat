const { io } = require('socket.io-client');

const URL = process.env.URL || 'http://localhost:3000';
const MAX_CLIENTS = 100;
const CLIENT_CREATION_INTERVAL_IN_MS = 10;
const EMIT_INTERVAL_IN_MS = 1000;

let clientCount = 0;
let connectedClients = 0;
const clients = [];

const createClient = () => {
  const socket = io(URL, {
    transports: ['websocket'],
    reconnection: true
  });

  socket.on('connect', () => {
    connectedClients++;
    console.log(`Client connected: ${socket.id} - Total connected: ${connectedClients}/${MAX_CLIENTS}`);
  });

  socket.on('disconnect', (reason) => {
    connectedClients--;
    console.log(`Client disconnected: ${socket.id} (${reason}) - Total connected: ${connectedClients}/${MAX_CLIENTS}`);
  });

  socket.on('connect_error', (err) => {
    console.error(`Client connect_error: ${err.message}`);
  });

  // Example of periodic message emission
  setInterval(() => {
    if (socket.connected) {
      // Assuming a simple ping event or similar
      socket.emit('ping', { timestamp: Date.now() });
    }
  }, EMIT_INTERVAL_IN_MS);

  clients.push(socket);
  clientCount++;

  if (clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  } else {
    console.log(`Finished creating ${MAX_CLIENTS} clients.`);
  }
};

console.log(`Starting load test against ${URL}`);
createClient();
