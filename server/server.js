const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
