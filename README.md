# Algoroom — Algorithmic Trading Platform

An algorithmic trading platform for Indian markets (NSE/BSE options trading). Build, backtest, and deploy multi-leg options strategies.

## Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React 18, Vite, React Router, Tailwind CSS |
| Backend    | Node.js, Express                       |
| Database   | MongoDB, Mongoose                      |
| Auth       | JWT (jsonwebtoken + bcryptjs)          |
| Charts     | Recharts                               |
| HTTP       | Axios                                  |

## Project Structure

```
AlgoRoom/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StrategyBuilder.jsx
│   │   │   ├── Backtesting.jsx
│   │   │   ├── LiveTrading.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StrategyLeg.jsx
│   │   │   ├── BacktestResults.jsx
│   │   │   ├── EquityCurve.jsx
│   │   │   └── PositionCard.jsx
│   │   ├── context/            # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useFetch.js
│   │   ├── services/           # API service layer
│   │   │   ├── api.js
│   │   │   └── strategyService.js
│   │   ├── utils/              # Utility functions
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                     # Express backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── strategyController.js
│   │   ├── backtestController.js
│   │   └── tradeController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Strategy.js
│   │   ├── Backtest.js
│   │   ├── Trade.js
│   │   └── Position.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── strategies.js
│   │   ├── backtest.js
│   │   └── trades.js
│   ├── server.js
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** (local or Atlas)

### 1. Clone the repository

```bash
git clone <repo-url>
cd AlgoRoom
```

### 2. Set up the server

```bash
cd server
cp .env.example .env         # Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev                  # Starts on http://localhost:5000
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev                  # Starts on http://localhost:3000
```

The Vite dev server proxies `/api` requests to the Express backend automatically.

## Core Features

1. **Strategy Builder** — Create multi-leg options strategies with configurable instrument, position (BUY/SELL), option type (CE/PE), expiry (Weekly/Monthly), strike type (ATM/ITM/OTM), stop loss, and take profit per leg.

2. **Backtesting** — Run saved strategies against historical date ranges. View total P&L, win/loss days, max drawdown, and daywise breakdown.

3. **Live Trading** — Deploy strategies with real or paper money. Monitor open positions and live P&L.

4. **Dashboard** — Portfolio overview with equity curve, active strategies, and recent trades.

## API Endpoints

| Method | Endpoint                     | Description            | Auth |
|--------|------------------------------|------------------------|------|
| POST   | `/api/auth/register`         | Register user          | No   |
| POST   | `/api/auth/login`            | Login user             | No   |
| GET    | `/api/auth/me`               | Get current user       | Yes  |
| GET    | `/api/strategies`            | List strategies        | Yes  |
| POST   | `/api/strategies`            | Create strategy        | Yes  |
| GET    | `/api/strategies/:id`        | Get strategy           | Yes  |
| PUT    | `/api/strategies/:id`        | Update strategy        | Yes  |
| DELETE | `/api/strategies/:id`        | Delete strategy        | Yes  |
| GET    | `/api/backtest`              | List backtests         | Yes  |
| POST   | `/api/backtest`              | Run backtest           | Yes  |
| GET    | `/api/backtest/:id`          | Get backtest result    | Yes  |
| GET    | `/api/trades`                | List trades            | Yes  |
| GET    | `/api/trades/positions`      | Get open positions     | Yes  |
| POST   | `/api/trades/deploy/:id`     | Deploy strategy live   | Yes  |
| POST   | `/api/trades/stop/:id`       | Stop live strategy     | Yes  |

## License

MIT
