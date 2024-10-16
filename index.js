const express = require('express');
const auth = require('./routes/user.routes');
const connectDb = require('./utils/db');
const http = require('http');
const socketIo = require('socket.io');
const adminRoutes = require('./routes/admin.routes');


require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//database connection
connectDb();
// WebSocket connection (Socket.io)
io.on('connection', (socket) => {
  console.log('A new user connected');

  // Listen for a message event (you can customize this for support tickets)
  socket.on('message', (msg) => {
      console.log(`Message received: ${msg}`);
      // Emit the message back to other clients or handle the logic here
      io.emit('message', msg);
  });

  // Handle disconnects
  socket.on('disconnect', () => {
      console.log('A user disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the server! This is the trustscalp backend.');
});

app.use('/api', auth);
app.use('/api/admin', adminRoutes);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});