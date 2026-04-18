const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { clerkMiddleware } = require('@clerk/express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const paperTradingEngine = require('./services/paperTradingEngine');
const { setIo } = require('./services/realtime');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setIo(io);

io.on('connection', (socket) => {
  socket.emit('realtime:connected', {
    connected: true,
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/strategies', require('./routes/strategies'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/trades', require('./routes/trades'));

app.get('/', (req, res) => {
  res.json({ message: 'Algoroom API is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  paperTradingEngine
    .recoverRunningDeployments()
    .then(() => {
      console.log('Paper engine recovery completed');
    })
    .catch((error) => {
      console.error('Paper engine recovery failed:', error.message);
    });
});
