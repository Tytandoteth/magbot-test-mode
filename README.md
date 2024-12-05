# MagnifyCash Lending Bot

A Telegram bot for decentralized micro-lending using Coinbase Smart Wallets and World ID verification.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/magnifycash-bot.git
cd magnifycash-bot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Run tests
npm test
```

## 🏗️ Architecture

- **Telegram Bot**: Built with Telegraf.js
- **Smart Contracts**: Deployed on Base network
- **Identity Verification**: World ID, Coinbase KYC (Coming Soon), Civic (Coming Soon)
- **Wallet Management**: Coinbase Smart Wallets
- **Gas Handling**: Coinbase Paymaster for gas-free transactions
- **Database**: MongoDB for analytics and user data
- **Monitoring**: Winston for logging, PM2 for process management

## 🔐 Features

- **Identity Verification**
  - World ID biometric verification
  - Coinbase KYC (Coming Soon)
  - Civic (Coming Soon)
  - Soulbound Token (SBT) for verified identities

- **Wallet Management**
  - Coinbase Smart Wallet creation
  - Gas-free transactions with Paymaster
  - Automated balance checks

- **Lending Features**
  - Loan amounts: $5, $10, $15
  - Terms: 7, 14, 30, 45, 60 days
  - Competitive APR rates
  - MAG token rewards

## 🛠️ Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 📦 Deployment

### Local Development
```bash
npm run dev
```

### Docker
```bash
# Build image
docker build -t magnifycash-bot .

# Run container
docker run -d --env-file .env magnifycash-bot
```

### Digital Ocean
```bash
# Deploy to DO App Platform
./scripts/deploy-do.sh
```

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
# See .env.example for all required variables
```

## 📝 Scripts

- `npm run dev`: Start development server
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run deploy`: Deploy to Digital Ocean
- `npm run docker:build`: Build Docker image
- `npm run docker:up`: Start Docker container

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE)