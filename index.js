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
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://127.0.0.1:5500', // Your live server
    'http://localhost:3000',  // Example: Allow localhost (you can add more URLs here)
    'http://example.com',
    'trustscalp.com',
    'http://trustscalp.com',
    'https://trustscalp.com'      // Example: Allow another domain
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  optionsSuccessStatus: 200 // Default response for older browsers
};
app.use(cors(corsOptions));

// Explicitly handle preflight (OPTIONS) requests without wildcards
app.options('/api/*', cors(corsOptions)); // Preflight for API routes
app.options('/api/admin/*', cors(corsOptions)); // Preflight for admin API routes


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
  res.send('Welcome to the server! This is the trustscalp backend. The frontend is at trustscalp.com');
});

app.use('/api', auth);
app.use('/api/admin', adminRoutes);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});